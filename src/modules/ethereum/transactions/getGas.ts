export function getGas<A>(transaction: { gas?: A; gasLimit?: A }) {
  return transaction.gas ?? transaction.gasLimit;
}
