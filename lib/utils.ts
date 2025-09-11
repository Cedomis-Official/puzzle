import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidEVMAddress(address: string): boolean {
  // Check if address starts with 0x and has exactly 42 characters (0x + 40 hex chars)
  const evmRegex = /^0x[a-fA-F0-9]{40}$/
  return evmRegex.test(address)
}

export function formatAddress(address: string): string {
  if (!isValidEVMAddress(address)) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
