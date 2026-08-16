/* eslint-disable react-refresh/only-export-components */
import type {ReactNode} from 'react';
import {createContext, useCallback, useContext, useMemo, useReducer} from 'react';
import type {Track} from '../types/track';

// ----- State shape -----
export interface PlayerState {
    currentTrack: Track | null;
    queue: Track[];
    queueIndex: number;           // vị trí hiện tại trong queue
    isPlaying: boolean;
    currentTime: number;          // giây
    duration: number;              // giây
    volume: number;               // 0..1
    isMuted: boolean;
    seekId: number;
}

const initialState: PlayerState = {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    seekId: 0
};

// ----- Actions -----
type PlayerAction =
    | { type: 'PLAY'; track: Track; queue?: Track[] }
    | { type: 'TOGGLE_PLAY' }
    | { type: 'SET_PLAYING'; isPlaying: boolean }
    | { type: 'NEXT' }
    | { type: 'PREV' }
    | { type: 'SEEK'; time: number }
    | { type: 'SET_TIME'; time: number }
    | { type: 'SET_DURATION'; duration: number }
    | { type: 'SET_VOLUME'; volume: number }
    | { type: 'TOGGLE_MUTE' }
    | { type: 'CLEAR' };

// ----- Reducer -----
const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
    switch (action.type) {
        case 'PLAY': {
            const queue = action.queue ?? [action.track];
            const queueIndex = queue.findIndex((t) => t.id === action.track.id);
            return {
                ...state,
                currentTrack: action.track,
                queue,
                queueIndex: queueIndex === -1 ? 0 : queueIndex,
                isPlaying: true,
                currentTime: 0,
            };
        }
        case 'TOGGLE_PLAY':
            return state.currentTrack
                ? {...state, isPlaying: !state.isPlaying}
                : state;
        case 'SET_PLAYING':
            return {...state, isPlaying: action.isPlaying};
        case 'NEXT': {
            if (state.queue.length === 0) return state;
            const nextIndex = (state.queueIndex + 1) % state.queue.length;
            return {
                ...state,
                currentTrack: state.queue[nextIndex],
                queueIndex: nextIndex,
                isPlaying: true,
                currentTime: 0,
            };
        }
        case 'PREV': {
            if (state.queue.length === 0) return state;
            // nếu đã nghe >3s -> về đầu track, không thì qua bài trước
            if (state.currentTime > 3) {
                return {...state, currentTime: 0};
            }
            const prevIndex =
                (state.queueIndex - 1 + state.queue.length) % state.queue.length;
            return {
                ...state,
                currentTrack: state.queue[prevIndex],
                queueIndex: prevIndex,
                isPlaying: true,
                currentTime: 0,
            };
        }
        case 'SEEK':
            return {...state, currentTime: action.time, seekId: state.seekId + 1};
        case 'SET_TIME':
            return {...state, currentTime: action.time};
        case 'SET_DURATION':
            return {...state, duration: action.duration};
        case 'SET_VOLUME':
            return {...state, volume: action.volume, isMuted: false};
        case 'TOGGLE_MUTE':
            return {...state, isMuted: !state.isMuted};
        case 'CLEAR':
            return initialState;
        default:
            return state;
    }
};

// ----- Context type -----
export interface PlayerContextType extends PlayerState {
    play: (track: Track, queue?: Track[]) => void;
    togglePlay: () => void;
    setPlaying: (isPlaying: boolean) => void;
    next: () => void;
    prev: () => void;
    seek: (time: number) => void;
    setTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    clear: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ----- Provider -----
export const PlayerProvider = ({children}: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(playerReducer, initialState);

    const play = useCallback((track: Track, queue?: Track[]) => {
        dispatch({type: 'PLAY', track, queue});
    }, []);
    const togglePlay = useCallback(() => dispatch({type: 'TOGGLE_PLAY'}), []);
    const setPlaying = useCallback((isPlaying: boolean) =>
        dispatch({type: 'SET_PLAYING', isPlaying}), []);
    const next = useCallback(() => dispatch({type: 'NEXT'}), []);
    const prev = useCallback(() => dispatch({type: 'PREV'}), []);
    const seek = useCallback((time: number) => dispatch({type: 'SEEK', time}), []);
    const setTime = useCallback((time: number) => dispatch({type: 'SET_TIME', time}), []);
    const setDuration = useCallback((duration: number) =>
        dispatch({type: 'SET_DURATION', duration}), []);
    const setVolume = useCallback((volume: number) =>
        dispatch({type: 'SET_VOLUME', volume}), []);
    const toggleMute = useCallback(() => dispatch({type: 'TOGGLE_MUTE'}), []);
    const clear = useCallback(() => dispatch({type: 'CLEAR'}), []);

    const value = useMemo<PlayerContextType>(() => ({
        ...state,
        play, togglePlay, setPlaying, next, prev,
        seek, setTime, setDuration, setVolume, toggleMute, clear,
    }), [state, play, togglePlay, setPlaying, next, prev, seek, setTime, setDuration, setVolume, toggleMute, clear]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = (): PlayerContextType => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};