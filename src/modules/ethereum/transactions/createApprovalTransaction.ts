import { ethers } from 'ethers';

export async function createApprovalTransaction(
  signer: ethers.Wallet,
  contractAddress: string,
  allowance: string,
  spender: string
) {
  const abi = [
    'function approve(address, uint256) public returns (bool success)',
  ];
  const contract = new ethers.Contract(contractAddress, abi, signer);
  return await contract.populateTransaction.approve(spender, allowance);
}
