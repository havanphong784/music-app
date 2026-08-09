export const sanitizeUser = <T extends Record<string, any>>(user: T | null): Omit<T, "password_hash"> | null => {
    if (!user) return null;
    const {password_hash: _passwordHash, ...safeUser} = user;
    return safeUser;
};

export const formatTrack = <T extends Record<string, any>>(track: T | null) => {
    if (!track) return null;
    return {
        ...track,
        play_count: track.play_count !== undefined && track.play_count !== null ? track.play_count.toString() : "0"
    };
};
