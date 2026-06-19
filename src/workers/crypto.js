import sodium from 'libsodium-wrappers-sumo';

self.onmessage = async (e) => {
    await sodium.ready;
    const { payload } = e.data;

    const key = sodium.crypto_pwhash(
        32,
        payload.masterPassword,
        sodium.from_base64(payload.salt),
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    self.postMessage({key: sodium.to_base64(key)});
};