import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";

module {
  public type ThreadedComment = {
    id : Nat;
    author : Principal;
    text : Text;
    media : ?{ #image : Blob; #video : Blob };
    likes : Set.Set<Principal>;
    replies : List.List<ThreadedComment>;
  };

  public type OldFeedItem = {
    id : Nat;
    media : { #video : Blob; #image : Blob };
    handle : Text;
    caption : Text;
    likeCount : Nat;
  };

  public type OldActor = {
    feedItems : List.List<OldFeedItem>;
    userLikes : Map.Map<Text, Set.Set<Principal>>;
    comments : Map.Map<Nat, List.List<{ id : Nat; author : Principal; text : Text; media : ?{ #video : Blob; #image : Blob } }>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public type NewActor = {
    feedItems : List.List<OldFeedItem>;
    userLikes : Map.Map<Text, Set.Set<Principal>>;
    comments : Map.Map<Nat, List.List<{ id : Nat; author : Principal; text : Text; media : ?{ #video : Blob; #image : Blob } }>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
