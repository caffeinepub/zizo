import Set "mo:core/Set";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    feedItems : List.List<{ id : Nat; media : { #video : Storage.ExternalBlob; #image : Storage.ExternalBlob }; handle : Text; caption : Text; likeCount : Nat }>;
    userLikes : Map.Map<Text, Set.Set<Principal>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  type NewFeedItem = {
    id : Nat;
    media : { #video : Storage.ExternalBlob; #image : Storage.ExternalBlob };
    handle : Text;
    caption : Text;
    likeCount : Nat;
  };

  type NewComment = {
    id : Nat;
    author : Principal;
    text : Text;
    media : ?{ #video : Storage.ExternalBlob; #image : Storage.ExternalBlob };
  };

  type NewActor = {
    feedItems : List.List<NewFeedItem>;
    userLikes : Map.Map<Text, Set.Set<Principal>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    comments : Map.Map<Nat, List.List<NewComment>>;
  };

  public func run(old : OldActor) : NewActor {
    let comments = Map.empty<Nat, List.List<NewComment>>();
    { old with comments };
  };
};
