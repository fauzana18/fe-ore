import sodium from 'libsodium-wrappers-sumo';

await sodium.ready;

export function useEncryptor() {
    const generateSalt = () => {
        const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
        return sodium.to_base64(salt);
    }

    const deriveVaultKey = async (masterPassword, saltBase64) => {
        const salt = sodium.from_base64(saltBase64);
        return sodium.crypto_pwhash(
            32,
            masterPassword,
            salt,
            sodium.crypto_pwhash_OPSLIMIT_MODERATE,
            sodium.crypto_pwhash_MEMLIMIT_MODERATE,
            sodium.crypto_pwhash_ALG_ARGON2ID13
        );
    }

    const encryptVaultItem = async (plaintextObject, vaultKey) => {
        const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
        const plaintext = JSON.stringify(plaintextObject);
        const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, null, null, nonce, vaultKey);

        return {nonce: sodium.to_base64(nonce), ciphertext: sodium.to_base64(ciphertext)};
    }

    const decryptVaultItem = async (encryptedData, vaultKey) => {
        const nonce = sodium.from_base64(encryptedData.nonce);
        const ciphertext = sodium.from_base64(encryptedData.ciphertext);
        const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ciphertext, null, nonce, vaultKey);
        const json = sodium.to_string(plaintext);
        return JSON.parse(json);
    }

    return {
        generateSalt,
        deriveVaultKey,
        encryptVaultItem,
        decryptVaultItem
    };
}
