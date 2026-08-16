import {keepPreviousData, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {type GetTracksParams, trackApi} from '../api/trackApi';

export const useTracks = (params: GetTracksParams) =>
    useQuery({
        queryKey: ['tracks', params],
        queryFn: () => trackApi.list(params),
        placeholderData: keepPreviousData,
    });

export const useTrack = (id: string) =>
    useQuery({
        queryKey: ['tracks', 'detail', id],
        queryFn: () => trackApi.detail(id),
        enabled: !!id,
    });

export const useStreamUrl = (id: string, enabled = true) =>
    useQuery({
        queryKey: ['tracks', 'stream', id],
        queryFn: () => trackApi.stream(id),
        enabled: !!id && enabled,
        staleTime: 1000 * 60 * 14,   // signed URL 15 phút (900s) -> refetch trước 1p
    });

export const usePlayTrack = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => trackApi.play(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({queryKey: ['tracks', 'detail', id]});
        },
    });
};