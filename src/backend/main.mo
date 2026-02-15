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
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

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

  let feedItems = List.empty<FeedItem>();
  let userLikes = Map.empty<Text, Set.Set<Principal>>();
  let comments = Map.empty<Nat, List.List<Comment>>();

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
    newComment;
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
};
