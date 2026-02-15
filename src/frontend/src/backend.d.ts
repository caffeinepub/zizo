import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Comment {
    id: bigint;
    media?: MediaType;
    text: string;
    author: Principal;
}
export interface FeedItem {
    id: bigint;
    media: MediaType;
    likeCount: bigint;
    caption: string;
    handle: string;
}
export type MediaType = {
    __kind__: "video";
    video: ExternalBlob;
} | {
    __kind__: "image";
    image: ExternalBlob;
};
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(feedItemId: bigint, commentText: string, media: MediaType | null): Promise<Comment>;
    addMedia(_media: MediaType, caption: string | null): Promise<FeedItem>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    fetchFeedItems(): Promise<Array<FeedItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(feedItemId: bigint): Promise<Array<Comment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchByKeyword(searchText: string): Promise<Array<FeedItem>>;
    toggleLike(feedItemId: string): Promise<void>;
}
