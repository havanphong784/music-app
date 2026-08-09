import assert from "node:assert/strict";
import test from "node:test";
import {NextFunction, Request, Response} from "express";
import {isAllowedMimeType} from "../api/v1/middlewares/uploadCloud.middleware";
import {createTrack, getTrackById} from "../api/v1/validates/track.validate";
import {getGenres} from "../api/v1/validates/genre.validate";
import {formatTrack} from "../api/v1/utils/response.utils";

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
});

test("formatTrack converts Prisma BigInt values before JSON serialization", () => {
    const track = formatTrack({id: "track", play_count: 12n});
    assert.ok(track);
    assert.equal(track.play_count, 12);
    assert.doesNotThrow(() => JSON.stringify(track));
});
