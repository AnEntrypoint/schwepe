// Wallet + Contract = thirdweb only
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from 'thirdweb'
import { defineChain } from 'thirdweb/chains'
import { createWallet } from 'thirdweb/wallets'

// DOM elements - must be declared before use
const statusEl = document.getElementById('status')
const buyBtn = document.getElementById('buyBtn')
const connectBtn = document.getElementById('connectBtn')
const disconnectBtn = document.getElementById('disconnectBtn')
const walletMenu = document.getElementById('walletMenu')
const panelStatus = document.getElementById('panelStatus')

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg || ''
  if (panelStatus) panelStatus.textContent = msg || ''
}

// Support both naming styles
const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID
if (!THIRDWEB_CLIENT_ID) {
  console.error('Missing VITE_THIRDWEB_CLIENT_ID environment variable')
  setStatus('Error: Missing wallet configuration. Please check environment setup.')
}
const CONTRACT_ADDRESS = (document.getElementById('contractAddress')?.textContent || '0x442CA6391F9a8201737cFC186ebC00b7ace0DB03').trim()

// Somnia testnet chain via thirdweb helper
const SOMNIA_TESTNET = defineChain(50312)

// Somnia Mainnet (custom viem chain)
// const SOMNIA_MAINNET = defineChain({
//   id: 5031,
//   name: 'Somnia Mainnet',
//   nativeCurrency: { name: 'Somnia', symbol: 'SOMI', decimals: 18 },
//   rpcUrls: { default: { http: ['https://somnia-json-rpc.stakely.io'] } },
//   blockExplorers: { default: { name: 'Somnia Explorer', url: 'https://mainnet.somnia.w3us.site/' } }
// })

async function copyAddr() {
  const addr = CONTRACT_ADDRESS
  await navigator.clipboard.writeText(addr)
  setStatus('Contract address copied')
}
window.copyAddr = copyAddr
const copyBtn = document.getElementById('copyContractBtn')
if (copyBtn) copyBtn.addEventListener('click', copyAddr)

// thirdweb client + chain + contract
const client = THIRDWEB_CLIENT_ID ? createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID }) : null
const wallets = [
  createWallet("sh.frame"),
  createWallet("io.zerion.wallet"),
  createWallet("io.rabby"),
  createWallet("me.rainbow"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.metamask"),
];
let contract = null
if (client) {
  contract = getContract({ client, chain: SOMNIA_TESTNET, address: CONTRACT_ADDRESS })
}
const defaultWallet = createWallet('io.metamask')
let account = null

async function ensureConnected() {
  if (account?.address) return account
  if (!client) {
    setStatus('Error: Wallet client not initialized. Please check VITE_THIRDWEB_CLIENT_ID.')
    throw new Error('Client not initialized')
  }
  try {
    const hasInjected = typeof window !== 'undefined' && window.ethereum
    if (hasInjected) {
      account = await defaultWallet.connect({ client })
      connectBtn.style.display = 'none'
      disconnectBtn.style.display = 'inline-flex'
    }  else {
      setStatus('No injected wallet found. Install MetaMask or set VITE_WC_PROJECT_ID')
      throw new Error('No wallet available')
    }
    setStatus('Connected: ' + account.address)
    if (buyBtn) buyBtn.innerHTML = '<i class="fas fa-fire"></i> MINT SCHW8BIT'
    return account
  } catch (e) {
    setStatus('Connect failed: ' + (e?.message || e))
    throw e
  }
}

function getDesiredQty() {
  const inputQty = document.getElementById('qtyInput')
  const fromPanel = Math.max(1, parseInt(inputQty?.value || '1', 10))
  document.getElementById('summaryQty').textContent = String(fromPanel)
  return fromPanel
}

buyBtn?.addEventListener('click', async () => {
  try {
    await ensureConnected()
    await performMint()
  } catch {}
})

disconnectBtn?.addEventListener('click', async () => {
  account = null
  connectBtn.style.display = 'inline-flex'
  disconnectBtn.style.display = 'none'
  buyBtn.innerHTML = '<i class="fas fa-fire"></i> Buy NFT'
  setStatus('Wallet disconnected')
})

connectBtn?.addEventListener('click', async () => {
  // Toggle wallet menu for selection
  if (walletMenu.style.display === 'none' || walletMenu.style.display === '') {
    walletMenu.innerHTML = ''
    const items = [
      { id: 'io.metamask', label: 'MetaMask' },
      { id: 'com.coinbase.wallet', label: 'Coinbase Wallet' },
      { id: 'me.rainbow', label: 'Rainbow' },
      { id: 'io.rabby', label: 'Rabby' },
      { id: 'io.zerion.wallet', label: 'Zerion' },
      { id: 'sh.frame', label: 'Frame' }
    ]
    items.forEach(({ id, label }) => {
      const btn = document.createElement('button')
      btn.textContent = label
      btn.style.cssText = 'width:100%;text-align:left;padding:10px 12px;margin:4px 0;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.15);cursor:pointer'
      btn.onclick = async () => {
        try {
          const w = createWallet(id)
          account = await w.connect({ client })
          connectBtn.style.display = 'none'
          disconnectBtn.style.display = 'inline-flex'
          setStatus('Connected: ' + account.address)
          buyBtn.innerHTML = '<i class="fas fa-fire"></i> MINT SCHW8BIT'
          walletMenu.style.display = 'none'
        } catch (e) {
          setStatus('Connect failed: ' + (e?.message || e))
        }
      }
      walletMenu.appendChild(btn)
    })
    walletMenu.style.display = 'block'
    document.addEventListener('click', onOutsideMenu, { once: true })
  } else {
    walletMenu.style.display = 'none'
  }
})

function onOutsideMenu(e) {
  if (!walletMenu.contains(e.target) && e.target !== connectBtn) {
    walletMenu.style.display = 'none'
  }
}

async function performMint() {
  if (!client || !contract) {
    setStatus('Error: Contract not initialized. Please check your configuration.')
    return
  }
  if (!account?.address) {
    setStatus('Please connect your wallet first')
    return
  }
  try {
    const qty = getDesiredQty()
    const tx = prepareContractCall({
      contract,
      method: 'function claimTo(address to, uint256 quantity)',
      params: [account.address, BigInt(qty)]
    })
    setStatus('Sending transaction...')
    const { transactionHash } = await sendTransaction({ transaction: tx, account })
    setStatus('Minted! Tx: ' + transactionHash)
    celebrate()
  } catch (e) {
    setStatus('Mint failed: ' + (e?.message || e))
  }
}

function celebrate() {
  // If canvas-confetti is available, fire bursts
  if (window.confetti) {
    const originY = 0.6
    window.confetti({ particleCount: 80, spread: 70, origin: { y: originY } })
    setTimeout(() => window.confetti({ particleCount: 120, spread: 100, origin: { y: originY } }), 250)
  } else {
    // Fallback: simple emoji burst
    const el = document.createElement('div')
    el.textContent = '🎉'
    el.style.position = 'fixed'
    el.style.left = '50%'
    el.style.top = '50%'
    el.style.transform = 'translate(-50%, -50%) scale(1.5)'
    el.style.zIndex = '9999'
    el.style.transition = 'all 600ms ease'
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      el.style.top = '30%'
      el.style.opacity = '0'
    })
    setTimeout(() => el.remove(), 700)
  }
}

// keep summary qty in sync
document.getElementById('qtyInput')?.addEventListener('input', () => {
  const q = Math.max(1, parseInt(document.getElementById('qtyInput').value || '1', 10))
  document.getElementById('summaryQty').textContent = String(q)
})

// ===== Corner Man (random Schwepes) like index.html =====
let leftCornerManImages = []
let rightCornerManImages = []

async function loadImagesFromFolder(folderPath, maxImages) {
  const imagePromises = []
  const potentialImages = []
  for (let i = 1; i <= maxImages; i++) {
    potentialImages.push(`${folderPath}schwepe-corner-${String(i).padStart(3, '0')}.png`)
  }
  for (const imagePath of potentialImages) {
    const p = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(imagePath)
      img.onerror = () => resolve(null)
      img.src = imagePath
    })
    imagePromises.push(p)
  }
  const results = await Promise.all(imagePromises)
  return results.filter(Boolean)
}

async function loadCornerManImages() {
  leftCornerManImages = await loadImagesFromFolder('public/cornermen/left/', 100)
  rightCornerManImages = await loadImagesFromFolder('public/cornermen/right/', 100)
}

function slideInCornerMan(fromLeft = true) {
  const cornerMan = document.getElementById('corner-man')
  const images = fromLeft ? leftCornerManImages : rightCornerManImages
  if (images.length === 0) return
  const randomIndex = Math.floor(Math.random() * images.length)
  const img = cornerMan.querySelector('img')
  img.src = images[randomIndex]
  if (fromLeft) {
    cornerMan.style.left = '-150px'
    cornerMan.style.right = 'auto'
  } else {
    cornerMan.style.right = '-150px'
    cornerMan.style.left = 'auto'
  }
  cornerMan.style.opacity = '1'
  if (fromLeft) cornerMan.style.transform = 'translateX(150px)'
  else cornerMan.style.transform = 'translateX(-150px)'
  setTimeout(() => {
    if (fromLeft) cornerMan.style.transform = 'translateX(-150px)'
    else cornerMan.style.transform = 'translateX(150px)'
    setTimeout(() => { cornerMan.style.opacity = '0' }, 800)
  }, 4000)
}

function showRandomCornerMan() {
  const fromLeft = Math.random() < 0.5
  slideInCornerMan(fromLeft)
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCornerManImages()
  setInterval(() => showRandomCornerMan(), Math.random() * 7000 + 8000)
  setTimeout(() => showRandomCornerMan(), 3000)
  document.getElementById('corner-man').addEventListener('click', () => {
    const fromLeft = Math.random() < 0.5
    slideInCornerMan(fromLeft)
  })
})