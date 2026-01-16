// id.js
export async function getInstallId() {
    const key = 'install_id_v1';
    const { [key]: existing } = await chrome.storage.local.get(key);
    if (existing) return existing;
  
    // 128-bit random
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  
    await chrome.storage.local.set({ [key]: id });
    return id;
  }
  // eslint-disable-next-line
  export async function resetInstallId() {
    await chrome.storage.local.remove('install_id_v1');
  }
  