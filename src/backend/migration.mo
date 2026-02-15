import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  public type OldVideo = {
    id : Nat;
    videoUrl : Text;
    handle : Text;
    caption : Text;
    likeCount : Nat;
  };

  public type OldActor = {
    videos : List.List<OldVideo>;
    userLikes : Map.Map<Text, Set.Set<Principal>>;
  };

  public type NewMediaType = {
    #video : Storage.ExternalBlob;
    #image : Storage.ExternalBlob;
  };

  public type NewFeedItem = {
    id : Nat;
    media : NewMediaType;
    handle : Text;
    caption : Text;
    likeCount : Nat;
  };

  public type NewActor = {
    feedItems : List.List<NewFeedItem>;
    userLikes : Map.Map<Text, Set.Set<Principal>>;
  };

  public func run(old : OldActor) : NewActor {
    let newFeedItems = List.empty<NewFeedItem>();
    {
      feedItems = newFeedItems;
      userLikes = old.userLikes;
    };
  };
};
