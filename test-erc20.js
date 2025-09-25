/**
 * Comprehensive ERC-20 Token Testing Script for Schwepe Token
 * Tests contract functionality on Somnia Network
 *
 * Contract: 0xdd10620866c4f586b1213d3818811faf3718fce3
 * RPC: https://dream-rpc.somnia.network
 */

const RPC_URL = 'https://dream-rpc.somnia.network';
const CONTRACT_ADDRESS = '0xdd10620866c4f586b1213d3818811faf3718fce3';

// ERC-20 Function Selectors (verified correct)
const FUNCTION_SELECTORS = {
    totalSupply: '0x18160ddd',
    decimals: '0x313ce567',
    symbol: '0x95d89b41',
    name: '0x06fdde03',
    balanceOf: '0x70a08231',
    transfer: '0xa9059cbb',
    approve: '0x095ea7b3',
    allowance: '0xdd62ed3e'
};

// Known ERC-20 return value parsers
function parseReturnValue(hexData, type) {
    if (!hexData || hexData === '0x') return null;

    // Remove 0x prefix
    const cleanHex = hexData.slice(2);

    switch (type) {
        case 'uint256':
            return BigInt('0x' + cleanHex);
        case 'uint8':
            return parseInt('0x' + cleanHex, 16);
        case 'string':
            try {
                // Ethereum strings are encoded as: offset(32) + length(32) + data(padded to 32)
                const offset = parseInt(cleanHex.slice(0, 64), 16);
                const length = parseInt(cleanHex.slice(offset * 2, offset * 2 + 64), 16);
                const dataStart = offset * 2 + 64;
                const dataEnd = dataStart + length * 2;
                const hexData = cleanHex.slice(dataStart, dataEnd);

                // Convert hex to string
                let result = '';
                for (let i = 0; i < hexData.length; i += 2) {
                    result += String.fromCharCode(parseInt(hexData.slice(i, i + 2), 16));
                }
                return result;
            } catch (error) {
                console.error('Error parsing string:', error);
                return null;
            }
        case 'address':
            return '0x' + cleanHex.slice(-40).padStart(40, '0');
        default:
            return hexData;
    }
}

// RPC Client
async function callRPC(method, params = []) {
    const startTime = Date.now();

    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: Date.now()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const latency = Date.now() - startTime;

        if (data.error) {
            throw new Error(`RPC Error: ${data.error.message} (Code: ${data.error.code})`);
        }

        return { result: data.result, latency };
    } catch (error) {
        throw new Error(`RPC call failed: ${error.message}`);
    }
}

// Encode function call
function encodeFunctionCall(functionName, params = []) {
    const selector = FUNCTION_SELECTORS[functionName];
    if (!selector) {
        throw new Error(`Unknown function: ${functionName}`);
    }

    // For functions with no parameters, just return the selector
    if (params.length === 0) {
        return selector;
    }

    // Pad parameters to 32 bytes and concatenate
    const paddedParams = params.map(param => {
        const hex = param.toString(16).padStart(64, '0');
        return hex;
    }).join('');

    return selector + paddedParams;
}

// Call contract method
async function callContract(functionName, params = []) {
    try {
        const data = encodeFunctionCall(functionName, params);

        const callData = {
            to: CONTRACT_ADDRESS,
            data: data
        };

        const response = await callRPC('eth_call', [callData, 'latest']);
        return response.result;
    } catch (error) {
        console.error(`❌ Error calling ${functionName}:`, error.message);
        return null;
    }
}

// Test basic RPC connectivity
async function testRPCConnectivity() {
    console.log('🔍 Testing RPC Connectivity...');

    try {
        // Test basic methods
        const [chainId, blockNumber, gasPrice] = await Promise.all([
            callRPC('eth_chainId'),
            callRPC('eth_blockNumber'),
            callRPC('eth_gasPrice')
        ]);

        console.log('✅ RPC Connected Successfully:');
        console.log(`   Chain ID: ${parseInt(chainId.result, 16)}`);
        console.log(`   Block Number: ${parseInt(blockNumber.result, 16).toLocaleString()}`);
        console.log(`   Gas Price: ${(parseInt(gasPrice.result, 16) / 1000000000).toFixed(2)} Gwei`);
        console.log(`   Latency: ${blockNumber.latency}ms`);

        return true;
    } catch (error) {
        console.error('❌ RPC Connection Failed:', error.message);
        return false;
    }
}

// Test contract existence
async function testContractExistence() {
    console.log('\n🔍 Testing Contract Existence...');

    try {
        const code = await callRPC('eth_getCode', [CONTRACT_ADDRESS, 'latest']);

        if (code && code !== '0x' && code !== '0x0') {
            console.log('✅ Contract Exists');
            console.log(`   Contract Code Size: ${(code.length - 2) / 2} bytes`);
            return true;
        } else {
            console.log('❌ Contract Does Not Exist or is Empty');
            return false;
        }
    } catch (error) {
        console.error('❌ Error Checking Contract Existence:', error.message);
        return false;
    }
}

// Test ERC-20 standard methods
async function testERC20Methods() {
    console.log('\n🔍 Testing ERC-20 Standard Methods...');

    const results = {};

    // Test basic view functions
    const tests = [
        { name: 'name', type: 'string', description: 'Token Name' },
        { name: 'symbol', type: 'string', description: 'Token Symbol' },
        { name: 'decimals', type: 'uint8', description: 'Token Decimals' },
        { name: 'totalSupply', type: 'uint256', description: 'Total Supply' }
    ];

    for (const test of tests) {
        try {
            const rawResult = await callContract(test.name);
            if (rawResult) {
                const parsedResult = parseReturnValue(rawResult, test.type);
                results[test.name] = parsedResult;

                console.log(`✅ ${test.description}:`);
                console.log(`   Raw: ${rawResult}`);
                console.log(`   Parsed: ${parsedResult}`);

                if (test.type === 'uint256') {
                    console.log(`   Formatted: ${Number(parsedResult).toLocaleString()}`);
                }
            } else {
                console.log(`❌ ${test.description}: Failed to get result`);
                results[test.name] = null;
            }
        } catch (error) {
            console.error(`❌ Error testing ${test.name}:`, error.message);
            results[test.name] = null;
        }
    }

    // Test balanceOf with zero address
    try {
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        const balanceData = encodeFunctionCall('balanceOf', [zeroAddress]);
        const balanceResult = await callRPC('eth_call', [{
            to: CONTRACT_ADDRESS,
            data: balanceData
        }, 'latest']);

        if (balanceResult) {
            const balance = parseReturnValue(balanceResult, 'uint256');
            results.balanceOfZero = balance;
            console.log(`✅ Balance of Zero Address: ${balance}`);
        }
    } catch (error) {
        console.error('❌ Error testing balanceOf:', error.message);
    }

    return results;
}

// Test network compatibility
async function testNetworkCompatibility() {
    console.log('\n🔍 Testing Network Compatibility...');

    try {
        // Get network information
        const [chainId, blockNumber, syncing] = await Promise.all([
            callRPC('eth_chainId'),
            callRPC('eth_blockNumber'),
            callRPC('eth_syncing')
        ]);

        const networkId = parseInt(chainId.result, 16);
        const blockNum = parseInt(blockNumber.result, 16);
        const isSyncing = syncing.result;

        console.log('✅ Network Information:');
        console.log(`   Chain ID: ${networkId}`);
        console.log(`   Block Number: ${blockNum.toLocaleString()}`);
        console.log(`   Syncing: ${isSyncing}`);

        // Check if this is a known network
        const knownNetworks = {
            1: 'Ethereum Mainnet',
            56: 'BSC Mainnet',
            137: 'Polygon Mainnet',
            43114: 'Avalanche Mainnet',
            250: 'Fantom Mainnet',
            42161: 'Arbitrum One',
            10: 'Optimism',
            100: 'Gnosis Chain'
        };

        const networkName = knownNetworks[networkId] || `Unknown Network (ID: ${networkId})`;
        console.log(`   Network Name: ${networkName}`);

        return {
            chainId: networkId,
            blockNumber: blockNum,
            syncing: isSyncing,
            networkName: networkName
        };
    } catch (error) {
        console.error('❌ Error Testing Network Compatibility:', error.message);
        return null;
    }
}

// Test function selector validation
async function testFunctionSelectors() {
    console.log('\n🔍 Testing Function Selectors...');

    // Test each selector individually
    for (const [functionName, selector] of Object.entries(FUNCTION_SELECTORS)) {
        try {
            const result = await callContract(functionName);
            if (result && result !== '0x') {
                console.log(`✅ ${functionName} (${selector}): Valid`);
            } else {
                console.log(`⚠️  ${functionName} (${selector}): No result or empty`);
            }
        } catch (error) {
            console.error(`❌ ${functionName} (${selector}): Error - ${error.message}`);
        }
    }
}

// Comprehensive test runner
async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive ERC-20 Token Tests');
    console.log('=' * 60);
    console.log(`Contract: ${CONTRACT_ADDRESS}`);
    console.log(`RPC: ${RPC_URL}`);
    console.log('=' * 60);

    const results = {
        rpc: null,
        contract: null,
        network: null,
        erc20: null,
        selectors: null
    };

    // Run all tests
    results.rpc = await testRPCConnectivity();

    if (results.rpc) {
        results.contract = await testContractExistence();

        if (results.contract) {
            results.network = await testNetworkCompatibility();
            results.erc20 = await testERC20Methods();
            results.selectors = await testFunctionSelectors();
        }
    }

    // Summary
    console.log('\n' + '=' * 60);
    console.log('📊 TEST SUMMARY');
    console.log('=' * 60);

    console.log(`RPC Connection: ${results.rpc ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Contract Exists: ${results.contract ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Network Compatible: ${results.network ? '✅ PASS' : '❌ FAIL'}`);

    if (results.erc20) {
        const erc20PassCount = Object.values(results.erc20).filter(v => v !== null).length;
        const erc20TotalCount = Object.keys(results.erc20).length;
        console.log(`ERC-20 Methods: ${erc20PassCount}/${erc20TotalCount} ✅ PASS`);
    }

    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');

    if (!results.rpc) {
        console.log('   • Check RPC endpoint URL and network connectivity');
        console.log('   • Verify RPC endpoint is accessible and not rate-limited');
    }

    if (!results.contract) {
        console.log('   • Verify contract address is correct');
        console.log('   • Check if contract is deployed on this network');
        console.log('   • Ensure you\'re on the correct blockchain network');
    }

    if (results.erc20) {
        if (!results.erc20.name) {
            console.log('   • Contract may not implement standard name() function');
        }
        if (!results.erc20.symbol) {
            console.log('   • Contract may not implement standard symbol() function');
        }
        if (!results.erc20.decimals) {
            console.log('   • Contract may not implement standard decimals() function');
        }
        if (!results.erc20.totalSupply) {
            console.log('   • Contract may not implement standard totalSupply() function');
        }
    }

    return results;
}

// Export functions for external use
module.exports = {
    callRPC,
    callContract,
    encodeFunctionCall,
    parseReturnValue,
    testRPCConnectivity,
    testContractExistence,
    testERC20Methods,
    testNetworkCompatibility,
    runComprehensiveTests,
    RPC_URL,
    CONTRACT_ADDRESS,
    FUNCTION_SELECTORS
};

// Run tests if this file is executed directly
async function main() {
    try {
        await runComprehensiveTests();
        console.log('\n✅ Tests completed!');
    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    }
}

// For direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}