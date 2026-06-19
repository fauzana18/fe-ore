import sodium from 'libsodium-wrappers-sumo';
import { vaultKeyStore } from '@/store/crypto';

const worker = new Worker(
    new URL('../workers/crypto.js', import.meta.url),
    { type: 'module' }
);

export function useEncryptor() {
    const generateSalt = async () => {
        await sodium.ready;
        const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
        return sodium.to_base64(salt);
    }

    const deriveVaultKey = async (masterPassword, salt) => {
        await sodium.ready;
        return new Promise((resolve) => {
            worker.postMessage({
                payload: { masterPassword, salt }
            });

            worker.onmessage = (e) => {
                const vaultKey = vaultKeyStore()
                const key = sodium.from_base64(e.data.key)
                vaultKey.setValue(key)
                resolve();
            };
        });
    }

    const encryptVaultItem = async (plaintextObject, vaultKey) => {
        await sodium.ready;
        const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
        const plaintext = JSON.stringify(plaintextObject);
        const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, null, null, nonce, vaultKey);

        return {nonce: sodium.to_base64(nonce), ciphertext: sodium.to_base64(ciphertext)};
    }

    const decryptVaultItem = async (encryptedData, vaultKey) => {
        await sodium.ready;
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
