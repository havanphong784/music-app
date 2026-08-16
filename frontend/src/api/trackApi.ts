import axiosClient from './axiosClient';
import type {StreamResponse, Track, TrackListResponse} from '../types/track';

export interface GetTracksParams {
    q?: string;
    album_id?: string;
    genre_id?: number;
    page?: number;
    limit?: number;
}

export const trackApi = {
    list: (params: GetTracksParams = {}) =>
        axiosClient
            .get<TrackListResponse>('/tracks', {params})
            .then((res) => res.data),

    detail: (id: string) =>
        axiosClient
            .get<{ track: Track }>(`/tracks/${id}`)
            .then((res) => res.data.track),

    stream: (id: string, redirect = false) =>
        axiosClient
            .get<StreamResponse>(`/tracks/${id}/stream`, {params: {redirect}})
            .then((res) => res.data),

    play: (id: string) =>
        axiosClient
            .post<{ message: string; play_count: string }>(`/tracks/${id}/play`)
            .then((res) => res.data),

    update: (id: string, body: FormData) =>
        axiosClient
            .patch<{ message: string; track: Track }>(`/tracks/${id}`, body, {
                headers: {'Content-Type': 'multipart/form-data'},
            })
            .then((res) => res.data.track),
};