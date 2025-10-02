// Wallet + Contract using Reown AppKit and Wagmi
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import { createConfig, reconnect, getAccount, watchAccount, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { http } from 'viem'

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

// Reown AppKit project ID
const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || import.meta.env.VITE_WC_PROJECT_ID
if (!REOWN_PROJECT_ID) {
  console.error('Missing VITE_REOWN_PROJECT_ID or VITE_WC_PROJECT_ID environment variable')
  setStatus('Error: Missing wallet configuration. Please check environment setup.')
}
const CONTRACT_ADDRESS = (document.getElementById('contractAddress')?.textContent || '0x442CA6391F9a8201737cFC186ebC00b7ace0DB03').trim()

// Define Somnia Testnet chain
const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
}

async function copyAddr() {
  const addr = CONTRACT_ADDRESS
  await navigator.clipboard.writeText(addr)
  setStatus('Contract address copied')
}
window.copyAddr = copyAddr
const copyBtn = document.getElementById('copyContractBtn')
if (copyBtn) copyBtn.addEventListener('click', copyAddr)

// Setup Wagmi config with Reown AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: [somniaTestnet, mainnet],
  projectId: REOWN_PROJECT_ID || 'demo-project-id',
  ssr: false
})

const config = wagmiAdapter.wagmiConfig || createConfig({
  chains: [somniaTestnet, mainnet],
  transports: {
    [somniaTestnet.id]: http(),
    [mainnet.id]: http(),
  },
})

// Create AppKit modal
let modal = null
if (REOWN_PROJECT_ID) {
  modal = createAppKit({
    adapters: [wagmiAdapter],
    networks: [somniaTestnet, mainnet],
    projectId: REOWN_PROJECT_ID,
    features: {
      analytics: true
    },
    defaultNetwork: somniaTestnet
  })
}

// Track connection state
let isConnected = false
let currentAddress = null

function updateConnectionUI() {
  const account = getAccount(config)
  isConnected = account.isConnected
  currentAddress = account.address
  
  if (isConnected && currentAddress) {
    connectBtn.style.display = 'none'
    disconnectBtn.style.display = 'inline-flex'
    setStatus('Connected: ' + currentAddress)
    if (buyBtn) buyBtn.innerHTML = '<i class="fas fa-fire"></i> MINT SCHW8BIT'
  } else {
    connectBtn.style.display = 'inline-flex'
    disconnectBtn.style.display = 'none'
    if (buyBtn) buyBtn.innerHTML = '<i class="fas fa-fire"></i> Buy NFT'
    setStatus('')
  }
}

// Watch for account changes
watchAccount(config, {
  onChange: (account) => {
    updateConnectionUI()
  }
})

// Reconnect on page load
reconnect(config)

async function ensureConnected() {
  const account = getAccount(config)
  if (account.isConnected && account.address) {
    return account
  }
  
  if (!modal) {
    setStatus('Error: Wallet modal not initialized. Please check VITE_REOWN_PROJECT_ID.')
    throw new Error('Modal not initialized')
  }
  
  // Open the AppKit modal to connect
  modal.open()
  throw new Error('Please connect your wallet')
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
  } catch (e) {
    // If user needs to connect, the modal will open
    if (e.message !== 'Please connect your wallet') {
      console.error('Buy button error:', e)
    }
  }
})

disconnectBtn?.addEventListener('click', async () => {
  if (modal) {
    modal.open()
  }
})

connectBtn?.addEventListener('click', async () => {
  if (modal) {
    modal.open()
  } else {
    setStatus('Error: Wallet modal not initialized')
  }
})

async function performMint() {
  const account = getAccount(config)
  
  if (!account.isConnected || !account.address) {
    setStatus('Please connect your wallet first')
    if (modal) modal.open()
    return
  }
  
  try {
    const qty = getDesiredQty()
    
    setStatus('Preparing transaction...')
    
    // Write to contract using Wagmi
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESS,
      abi: [
        {
          name: 'claimTo',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'quantity', type: 'uint256' }
          ],
          outputs: []
        }
      ],
      functionName: 'claimTo',
      args: [account.address, BigInt(qty)],
      chainId: somniaTestnet.id
    })
    
    setStatus('Transaction sent! Waiting for confirmation...')
    
    // Wait for transaction receipt
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: somniaTestnet.id
    })
    
    setStatus('Minted! Tx: ' + receipt.transactionHash)
    celebrate()
  } catch (e) {
    console.error('Mint error:', e)
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
  leftCornerManImages = await loadImagesFromFolder('cornermen/left/', 100)
  rightCornerManImages = await loadImagesFromFolder('cornermen/right/', 100)
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
  updateConnectionUI()
  await loadCornerManImages()
  setInterval(() => showRandomCornerMan(), Math.random() * 7000 + 8000)
  setTimeout(() => showRandomCornerMan(), 3000)
  document.getElementById('corner-man').addEventListener('click', () => {
    const fromLeft = Math.random() < 0.5
    slideInCornerMan(fromLeft)
  })
})