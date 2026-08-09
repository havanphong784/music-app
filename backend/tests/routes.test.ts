import assert from "node:assert/strict";
import test from "node:test";
import {NextFunction, Request, Response} from "express";
import {hasValidFileSignature, isAllowedMimeType} from "../api/v1/middlewares/uploadCloud.middleware";
import {createTrack, getTrackById} from "../api/v1/validates/track.validate";
import {getGenres} from "../api/v1/validates/genre.validate";
import {createAlbum} from "../api/v1/validates/album.validate";
import {reorderTracks} from "../api/v1/validates/playlist.validate";
import {formatTrack} from "../api/v1/utils/response.utils";
import {handleError} from "../api/v1/middlewares/error.middleware";

const runMiddleware = async (
    middleware: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>,
    request: Partial<Request>
) => {
    let status = 200;
    let payload: unknown;
    let nextCalled = false;
    const res = {
        status(code: number) {
            status = code;
            return this;
        },
        json(value: unknown) {
            payload = value;
            return this;
        }
    } as unknown as Response;
    const next: NextFunction = () => { nextCalled = true; };
    await middleware(request as Request, res, next);
    return {status, payload, nextCalled};
};

test("route validators reject malformed track id and genre pagination", async () => {
    const track = await runMiddleware(getTrackById, {params: {id: "not-a-uuid"}});
    assert.equal(track.status, 400);
    assert.equal(track.nextCalled, false);

    const genrePagination = await runMiddleware(getGenres, {query: {page: "invalid"}});
    assert.equal(genrePagination.status, 400);
    assert.equal(genrePagination.nextCalled, false);
});

test("upload MIME rules keep image and audio fields separate", () => {
    assert.equal(isAllowedMimeType("audio/mpeg", "audio"), true);
    assert.equal(isAllowedMimeType("image/png", "audio"), false);
    assert.equal(isAllowedMimeType("image/jpeg", "image"), true);
    assert.equal(isAllowedMimeType("video/mp4", "image"), false);
    assert.equal(hasValidFileSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image"), true);
    assert.equal(hasValidFileSignature(Buffer.from("not-an-image"), "image"), false);
    assert.equal(hasValidFileSignature(Buffer.from("ID3audio"), "audio"), true);
    assert.equal(hasValidFileSignature(Buffer.from("not-audio"), "audio"), false);
});

test("track validation rejects decimal duration and malformed artist_id", async () => {
    const decimal = await runMiddleware(createTrack, {
        body: {title: "Song", audio_url: "audio-id", duration_seconds: 1.5}
    });
    assert.equal(decimal.status, 400);
    assert.equal(decimal.nextCalled, false);

    const artist = await runMiddleware(createTrack, {
        body: {title: "Song", audio_url: "audio-id", artist_id: "bad-id"}
    });
    assert.equal(artist.status, 400);
    assert.equal(artist.nextCalled, false);

    const lyrics = await runMiddleware(createTrack, {
        body: {title: "Song", audio_url: "audio-id", lyrics: "not-json"}
    });
    assert.equal(lyrics.status, 400);
});

test("album dates and playlist reorder payloads are strict", async () => {
    const invalidDate = await runMiddleware(createAlbum, {
        body: {title: "Album", release_date: "2026-02-31"}
    });
    assert.equal(invalidDate.status, 400);

    const duplicatePosition = await runMiddleware(reorderTracks, {
        params: {id: "550e8400-e29b-41d4-a716-446655440000"},
        body: {
            items: [
                {track_id: "550e8400-e29b-41d4-a716-446655440001", position: 1},
                {track_id: "550e8400-e29b-41d4-a716-446655440002", position: 1}
            ]
        }
    });
    assert.equal(duplicatePosition.status, 400);
});

test("formatTrack converts Prisma BigInt values before JSON serialization", () => {
    const track = formatTrack({id: "track", play_count: 12n});
    assert.ok(track);
    assert.equal(track.play_count, "12");
    assert.doesNotThrow(() => JSON.stringify(track));
});

test("global error handler preserves client error status", () => {
    let status = 0;
    let payload: unknown;
    const res = {
        headersSent: false,
        status(code: number) {
            status = code;
            return this;
        },
        json(value: unknown) {
            payload = value;
            return this;
        }
    } as unknown as Response;

    handleError({status: 400}, {} as Request, res, (() => undefined) as NextFunction);
    assert.equal(status, 400);
    assert.deepEqual(payload, {message: "JSON không hợp lệ"});
});
