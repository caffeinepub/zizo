import Set "mo:core/Set";
import Map "mo:core/Map";
import List "mo:core/List";
import Char "mo:core/Char";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type MediaType = {
    #video : Storage.ExternalBlob;
    #image : Storage.ExternalBlob;
  };

  public type FeedItem = {
    id : Nat;
    media : MediaType;
    handle : Text;
    caption : Text;
    likeCount : Nat;
  };

  public type Comment = {
    id : Nat;
    author : Principal;
    text : Text;
    media : ?MediaType;
  };

  public type ThreadedComment = {
    id : Nat;
    author : Principal;
    text : Text;
    media : ?MediaType;
    likes : Set.Set<Principal>;
    replies : List.List<ThreadedComment>;
  };

  public type Reply = ThreadedComment;

  public type ThreadedCommentView = {
    id : Nat;
    author : Principal;
    text : Text;
    media : ?MediaType;
    likeCount : Nat;
    replies : [ThreadedCommentView];
  };

  public type ReplyView = ThreadedCommentView;

  let feedItems = List.empty<FeedItem>();
  let userLikes = Map.empty<Text, Set.Set<Principal>>();
  let comments = Map.empty<Nat, List.List<Comment>>();
  let threadedComments = Map.empty<Nat, List.List<ThreadedComment>>();

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addMedia(_media : MediaType, caption : ?Text) : async FeedItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User authentication is required for adding media");
    };

    let newFeedItem : FeedItem = {
      id = feedItems.size();
      media = _media;
      handle = "@" # caller.toText();
      caption = switch (caption) {
        case (null) { "" };
        case (?cap) { cap };
      };
      likeCount = 0;
    };

    feedItems.add(newFeedItem);
    comments.add(newFeedItem.id, List.empty<Comment>());
    threadedComments.add(newFeedItem.id, List.empty<ThreadedComment>());
    newFeedItem;
  };

  public query ({ caller }) func fetchFeedItems() : async [FeedItem] {
    feedItems.toArray();
  };

  public shared ({ caller }) func toggleLike(feedItemId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User authentication is required to like/unlike items");
    };

    let userHasLiked = switch (userLikes.get(feedItemId)) {
      case (null) { false };
      case (?likes) { likes.contains(caller) };
    };

    let oldFeedItemsArray = feedItems.toArray();
    let oldFeedItemsCopy = List.fromArray<FeedItem>(oldFeedItemsArray);

    let updatedFeedItems = oldFeedItemsCopy.map<FeedItem, FeedItem>(
      func(item) {
        var updatedItem = item;
        if (Text.equal(feedItemId, item.id.toText())) {
          updatedItem := {
            item with likeCount = if (userHasLiked) {
              item.likeCount - 1;
            } else {
              item.likeCount + 1;
            };
          };
        };
        updatedItem;
      }
    );

    feedItems.clear();
    feedItems.addAll(updatedFeedItems.values());

    if (userHasLiked) {
      switch (userLikes.get(feedItemId)) {
        case (null) { };
        case (?likes) {
          let newLikes = Set.empty<Principal>();
          for (user in likes.values()) {
            if (user != caller) {
              newLikes.add(user);
            };
          };
          userLikes.add(feedItemId, newLikes);
        };
      };
    } else {
      let newLikes = switch (userLikes.get(feedItemId)) {
        case (null) {
          let newSet = Set.empty<Principal>();
          newSet.add(caller);
          newSet;
        };
        case (?likes) {
          let newSet = Set.empty<Principal>();
          for (user in likes.values()) {
            newSet.add(user);
          };
          newSet.add(caller);
          newSet;
        };
      };
      userLikes.add(feedItemId, newLikes);
    };
  };

  func toLower(text : Text) : Text {
    text.map(
      func(char) {
        if (char >= 'A' and char <= 'Z') {
          Char.fromNat32(char.toNat32() + 32);
        } else {
          char;
        };
      }
    );
  };

  public query ({ caller }) func searchByKeyword(searchText : Text) : async [FeedItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be user or above to search");
    };

    feedItems.filter(func(item) {
      toLower(item.handle).contains(#text(toLower(searchText))) or
      toLower(item.caption).contains(#text(toLower(searchText)))
    }).toArray();
  };

  public shared ({ caller }) func addComment(feedItemId : Nat, commentText : Text, media : ?MediaType) : async Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    let newComment : Comment = {
      id = switch (comments.get(feedItemId)) {
        case (null) { 0 };
        case (?existingComments) { existingComments.size() };
      };
      author = caller;
      text = commentText;
      media;
    };

    let existingComments = switch (comments.get(feedItemId)) {
      case (null) { List.empty<Comment>() };
      case (?existingComments) { existingComments };
    };

    existingComments.add(newComment);
    comments.add(feedItemId, existingComments);

    // Also add to threaded comments structure
    let newThreadedComment : ThreadedComment = {
      id = newComment.id;
      author = caller;
      text = commentText;
      media;
      likes = Set.empty<Principal>();
      replies = List.empty<ThreadedComment>();
    };

    let existingThreadedComments = switch (threadedComments.get(feedItemId)) {
      case (null) { List.empty<ThreadedComment>() };
      case (?existing) { existing };
    };

    existingThreadedComments.add(newThreadedComment);
    threadedComments.add(feedItemId, existingThreadedComments);

    newComment;
  };

  func convertThreadedCommentToView(comment : ThreadedComment) : ThreadedCommentView {
    {
      comment with
      likeCount = comment.likes.size();
      replies = comment.replies.map<ThreadedComment, ThreadedCommentView>(convertThreadedCommentToView).toArray();
    };
  };

  func convertReplyToReplyView(reply : ThreadedComment) : ReplyView {
    {
      id = reply.id;
      author = reply.author;
      text = reply.text;
      media = reply.media;
      likeCount = reply.likes.size();
      replies = reply.replies.map<ThreadedComment, ReplyView>(convertReplyToReplyView).toArray();
    };
  };

  public query ({ caller }) func getComments(feedItemId : Nat) : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    switch (comments.get(feedItemId)) {
      case (null) { [] };
      case (?existingComments) { existingComments.toArray() };
    };
  };

  public query ({ caller }) func getThreadedComments(feedItemId : Nat) : async [ThreadedCommentView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    switch (threadedComments.get(feedItemId)) {
      case (null) { [] };
      case (?existingComments) {
        existingComments.map<ThreadedComment, ThreadedCommentView>(convertThreadedCommentToView).toArray();
      };
    };
  };

  public shared ({ caller }) func likeComment(feedItemId : Nat, commentId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like comments");
    };

    let existingComments = switch (threadedComments.get(feedItemId)) {
      case (null) { Runtime.trap("Feed item not found") };
      case (?comments) { comments };
    };

    var commentFound = false;
    let updatedComments = List.empty<ThreadedComment>();

    for (comment in existingComments.values()) {
      if (comment.id == commentId) {
        commentFound := true;
        let isLiked = comment.likes.contains(caller);
        let newLikes = Set.empty<Principal>();

        for (user in comment.likes.values()) {
          if (user != caller) {
            newLikes.add(user);
          };
        };

        if (not isLiked) {
          newLikes.add(caller);
        };

        updatedComments.add({
          comment with
          likes = newLikes
        });
      } else {
        updatedComments.add(comment);
      };
    };

    if (not commentFound) {
      Runtime.trap("Comment not found");
    };

    threadedComments.add(feedItemId, updatedComments);
  };

  func findAndUpdateReplies(
    replies : List.List<ThreadedComment>,
    replyId : Nat,
    caller : Principal,
  ) : (List.List<ThreadedComment>, Bool) {
    var found = false;
    let updatedReplies = List.empty<ThreadedComment>();

    for (reply in replies.values()) {
      if (reply.id == replyId) {
        found := true;
        let isLiked = reply.likes.contains(caller);
        let newLikes = Set.empty<Principal>();

        for (user in reply.likes.values()) {
          if (user != caller) {
            newLikes.add(user);
          };
        };

        if (not isLiked) {
          newLikes.add(caller);
        };

        updatedReplies.add({
          reply with
          likes = newLikes
        });
      } else {
        let (nestedReplies, nestedFound) = findAndUpdateReplies(reply.replies, replyId, caller);
        if (nestedFound) {
          found := true;
        };
        updatedReplies.add({
          reply with
          replies = nestedReplies
        });
      };
    };

    (updatedReplies, found);
  };

  public shared ({ caller }) func addReply(
    feedItemId : Nat,
    parentCommentId : Nat,
    replyText : Text,
    media : ?MediaType,
  ) : async (?ReplyView, [ReplyView]) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reply");
    };

    let existingComments = switch (threadedComments.get(feedItemId)) {
      case (null) { return (null, []) };
      case (?comments) { comments };
    };

    var parentFound = false;
    var replyIdCounter : Nat = 0;

    for (comment in existingComments.values()) {
      replyIdCounter := replyIdCounter + 1 + comment.replies.size();
    };

    let newReply : ThreadedComment = {
      id = replyIdCounter;
      author = caller;
      text = replyText;
      media;
      likes = Set.empty<Principal>();
      replies = List.empty<ThreadedComment>();
    };

    func addReplyToComment(comment : ThreadedComment) : ThreadedComment {
      if (comment.id == parentCommentId) {
        parentFound := true;
        let updatedReplies = comment.replies.clone();
        updatedReplies.add(newReply);
        {
          comment with
          replies = updatedReplies
        };
      } else {
        let updatedReplies = List.empty<ThreadedComment>();
        for (reply in comment.replies.values()) {
          updatedReplies.add(addReplyToComment(reply));
        };
        {
          comment with
          replies = updatedReplies
        };
      };
    };

    let updatedComments = existingComments.map<ThreadedComment, ThreadedComment>(addReplyToComment);

    if (not parentFound) {
      return (null, []);
    };

    threadedComments.add(feedItemId, updatedComments);
    (?convertReplyToReplyView(newReply), updatedComments.map<ThreadedComment, ReplyView>(convertReplyToReplyView).toArray());
  };

  public shared ({ caller }) func deleteComment(feedItemId : Nat, commentId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

    let existingComments = switch (threadedComments.get(feedItemId)) {
      case (null) { Runtime.trap("Feed item not found") };
      case (?comments) { comments };
    };

    var commentFound = false;
    var commentAuthor : ?Principal = null;

    for (comment in existingComments.values()) {
      if (comment.id == commentId) {
        commentFound := true;
        commentAuthor := ?comment.author;
      };
    };

    if (not commentFound) {
      Runtime.trap("Comment not found");
    };

    switch (commentAuthor) {
      case (null) { Runtime.trap("Comment not found") };
      case (?author) {
        if (author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own comments");
        };
      };
    };

    let filteredComments = List.empty<ThreadedComment>();
    for (comment in existingComments.values()) {
      if (comment.id != commentId) {
        filteredComments.add(comment);
      };
    };

    threadedComments.add(feedItemId, filteredComments);

    let oldComments = switch (comments.get(feedItemId)) {
      case (null) { List.empty<Comment>() };
      case (?c) { c };
    };

    let filteredOldComments = List.empty<Comment>();
    for (comment in oldComments.values()) {
      if (comment.id != commentId) {
        filteredOldComments.add(comment);
      };
    };
    comments.add(feedItemId, filteredOldComments);
  };

  func findReplyAuthor(replies : List.List<ThreadedComment>, replyId : Nat) : ?Principal {
    for (reply in replies.values()) {
      if (reply.id == replyId) {
        return ?reply.author;
      };
      let nestedAuthor = findReplyAuthor(reply.replies, replyId);
      switch (nestedAuthor) {
        case (?author) { return ?author };
        case (null) { };
      };
    };
    null;
  };

  func removeReplyFromList(
    replies : List.List<ThreadedComment>,
    replyId : Nat,
    caller : Principal,
    isAdmin : Bool,
  ) : (List.List<ThreadedComment>, Bool) {
    var removed = false;
    let updatedReplies = List.empty<ThreadedComment>();

    for (reply in replies.values()) {
      if (reply.id == replyId) {
        if (reply.author != caller and not isAdmin) {
          Runtime.trap("Unauthorized: Can only delete your own replies");
        };
        removed := true;
      } else {
        let (nestedReplies, nestedRemoved) = removeReplyFromList(reply.replies, replyId, caller, isAdmin);
        if (nestedRemoved) {
          removed := true;
        };
        updatedReplies.add({
          reply with
          replies = nestedReplies
        });
      };
    };

    (updatedReplies, removed);
  };

  public shared ({ caller }) func deleteReply(
    feedItemId : Nat,
    parentCommentId : Nat,
    replyId : Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete replies");
    };

    let existingComments = switch (threadedComments.get(feedItemId)) {
      case (null) { Runtime.trap("Feed item not found") };
      case (?comments) { comments };
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    var replyRemoved = false;

    let updatedComments = List.empty<ThreadedComment>();
    for (comment in existingComments.values()) {
      let (updatedReplies, removed) = removeReplyFromList(comment.replies, replyId, caller, isAdmin);
      if (removed) {
        replyRemoved := true;
      };
      updatedComments.add({
        comment with
        replies = updatedReplies
      });
    };

    if (not replyRemoved) {
      Runtime.trap("Reply not found");
    };

    threadedComments.add(feedItemId, updatedComments);
  };
};
