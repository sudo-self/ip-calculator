import React, { useState } from 'react';
import { Calculator, Binary, Network, Globe2, Sun, Moon } from 'lucide-react';

interface IPAddress {
  octets: number[];
  cidr: number;
  isIPv6: boolean;
  ipv6Address: string;
}

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [ipInput, setIpInput] = useState('192.168.1.1');
  const [ipv6Input, setIpv6Input] = useState('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
  const [ipAddress, setIpAddress] = useState<IPAddress>({
    octets: [192, 168, 1, 1],
    cidr: 24,
    isIPv6: false,
    ipv6Address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
  });
  const [error, setError] = useState<string>('');

  const validateIPv4 = (ip: string): boolean => {
    if (ip === '') return true;
    const parts = ip.split('.');
    if (parts.length > 4) return false;
    return parts.every(part => {
      if (part === '') return true;
      const num = parseInt(part);
      return !isNaN(num) && num >= 0 && num <= 255;
    });
  };

  const validateIPv6 = (ip: string): boolean => {
    if (ip === '') return true;
    const regex = /^(?:[0-9a-fA-F]{0,4}:){0,7}[0-9a-fA-F]{0,4}$/;
    return regex.test(ip);
  };

  const handleIPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (ipAddress.isIPv6) {
      if (validateIPv6(value)) {
        setIpv6Input(value);
        setError('');
        if (value.match(/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)) {
          setIpAddress({ ...ipAddress, ipv6Address: value });
        }
      } else {
        setError('Invalid IPv6 address format');
      }
    } else {
      if (validateIPv4(value)) {
        setIpInput(value);
        setError('');
        const parts = value.split('.');
        if (parts.length === 4 && parts.every(part => part !== '' && !isNaN(parseInt(part)))) {
          const newOctets = parts.map(o => parseInt(o));
          setIpAddress({ ...ipAddress, octets: newOctets });
        }
      } else {
        setError('Invalid IPv4 address format');
      }
    }
  };

  const handleCIDRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const maxCIDR = ipAddress.isIPv6 ? 128 : 32;
    
    if (value >= 0 && value <= maxCIDR) {
      setIpAddress({ ...ipAddress, cidr: value });
      setError('');
    } else {
      setError(`CIDR must be between 0 and ${maxCIDR}`);
    }
  };

  const calculateSubnetMask = (): string => {
    if (ipAddress.isIPv6) return ''; // IPv6 subnet mask calculation would go here
    
    const mask = new Array(4).fill(0);
    const fullOctets = Math.floor(ipAddress.cidr / 8);
    const remainingBits = ipAddress.cidr % 8;

    for (let i = 0; i < fullOctets; i++) {
      mask[i] = 255;
    }

    if (remainingBits > 0) {
      mask[fullOctets] = 256 - Math.pow(2, 8 - remainingBits);
    }

    return mask.join('.');
  };

  const toBinary = (num: number): string => {
    return num.toString(2).padStart(8, '0');
  };

  const getNetworkAddress = (): string => {
    if (ipAddress.isIPv6) return ''; // IPv6 network address calculation would go here
    
    const mask = calculateSubnetMask().split('.').map(n => parseInt(n));
    return ipAddress.octets.map((octet, i) => octet & mask[i]).join('.');
  };

  const getBroadcastAddress = (): string => {
    if (ipAddress.isIPv6) return ''; // IPv6 doesn't use broadcast addresses
    
    const mask = calculateSubnetMask().split('.').map(n => parseInt(n));
    return ipAddress.octets.map((octet, i) => octet | (255 - mask[i])).join('.');
  };

  const getAvailableHosts = (): number => {
    if (ipAddress.isIPv6) {
      return Math.pow(2, 128 - ipAddress.cidr);
    }
    return Math.pow(2, 32 - ipAddress.cidr) - 2;
  };

  const getIPClass = (): string => {
    if (ipAddress.isIPv6) return '(IPv6)';
    
    const firstOctet = ipAddress.octets[0];
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
    if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)';
    return 'Invalid';
  };

  const isPrivateIP = (): boolean => {
    if (ipAddress.isIPv6) {
      return ipAddress.ipv6Address.toLowerCase().startsWith('fc00') || 
             ipAddress.ipv6Address.toLowerCase().startsWith('fd00');
    }
    
    const [first, second] = ipAddress.octets;
    return (
      (first === 10) || // Class A private
      (first === 172 && second >= 16 && second <= 31) || // Class B private
      (first === 192 && second === 168) // Class C private
    );
  };

  const getUsableRange = (): { first: string; last: string } => {
    if (ipAddress.isIPv6) {
      return { first: '(IPv6)', last: '(IPv6)' };
    }
    
    const networkAddr = getNetworkAddress().split('.').map(n => parseInt(n));
    const broadcastAddr = getBroadcastAddress().split('.').map(n => parseInt(n));
    
    const firstUsable = [...networkAddr];
    firstUsable[3] += 1;
    
    const lastUsable = [...broadcastAddr];
    lastUsable[3] -= 1;
    
    return {
      first: firstUsable.join('.'),
      last: lastUsable.join('.')
    };
  };

  const toggleIPVersion = () => {
    setIpAddress(prev => ({
      ...prev,
      isIPv6: !prev.isIPv6,
      cidr: !prev.isIPv6 ? 64 : 24 // Default CIDR for IPv6/IPv4
    }));
    setError('');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-br from-gray-100 to-white text-gray-800'} p-8`}>
      <div className={`max-w-2xl mx-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-8`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calculator className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className="text-3xl font-bold">IP Calculator</h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={toggleIPVersion}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-gray-600 hover:bg-green-700' 
                  : 'bg-gray-500 hover:bg-green-600 text-white'
              }`}
            >
              Switch to {ipAddress.isIPv6 ? 'IPv4' : 'IPv6'}
            </button>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {ipAddress.isIPv6 ? 'IPv6 Address' : 'IPv4 Address'}
            </label>
            <input
              type="text"
              value={ipAddress.isIPv6 ? ipv6Input : ipInput}
              onChange={handleIPChange}
              placeholder={ipAddress.isIPv6 ? '2001:0db8:85a3:0000:0000:8a2e:0370:7334' : '192.168.1.1'}
              className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              CIDR Notation
            </label>
            <input
              type="number"
              value={ipAddress.cidr}
              onChange={handleCIDRChange}
              min="0"
              max={ipAddress.isIPv6 ? "128" : "32"}
              className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium">{error}</div>
          )}

          <div className={`mt-8 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} rounded-lg p-6`}>
            <div className="flex items-center gap-2">
              <Binary className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className="text-xl font-semibold">Network Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!ipAddress.isIPv6 && (
                <>
                  <div className="space-y-1">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subnet Mask</p>
                    <p className="font-mono">{calculateSubnetMask()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Network Address</p>
                    <p className="font-mono">{getNetworkAddress()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Broadcast Address</p>
                    <p className="font-mono">{getBroadcastAddress()}</p>
                  </div>
                </>
              )}
              <div className="space-y-1">
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Available Hosts</p>
                <p className="font-mono">{getAvailableHosts().toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Network className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className="text-xl font-semibold">Address Range</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>First Usable Address</p>
                  <p className="font-mono">{getUsableRange().first}</p>
                </div>
                <div className="space-y-1">
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Last Usable Address</p>
                  <p className="font-mono">{getUsableRange().last}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className="text-xl font-semibold">IP Classification</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>IP Class</p>
                  <p className="font-mono">{getIPClass()}</p>
                </div>
                <div className="space-y-1">
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Address Type</p>
                  <p className="font-mono">{isPrivateIP() ? 'Private' : 'Public'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Binary Representation</p>
              <div className="font-mono text-sm break-all">
                {ipAddress.isIPv6 
                  ? ipAddress.ipv6Address
                  : ipAddress.octets.map(octet => toBinary(octet)).join('.')}
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
<footer className="mt-8 text-center text-sm text-gray-500">
  powered by&nbsp;&nbsp;<a 
    href="https://calc.jessejesse.com/" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="hover:underline text-green-700"
  >jessejesse.com</a>
</footer>
      </div>
    </div>
  );
}

export default App;




