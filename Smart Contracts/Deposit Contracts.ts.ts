import { SmartContract, Bitcoin, Address, UInt64, assert } from 'fractal-bitcoin-sdk';

class DepositContract extends SmartContract {
  // State variables
  private deposits: Map<Address, UInt64>; // Stores deposits for each user
  private totalDeposits: UInt64;          // Tracks total deposits in the contract
  private yieldOptimizer: Address;        // Address of the yield optimization logic

  constructor(yieldOptimizer: Address) {
    super();
    this.deposits = new Map<Address, UInt64>();
    this.totalDeposits = UInt64.zero();
    this.yieldOptimizer = yieldOptimizer;
  }

  // Deposit function: Allows a user to deposit Bitcoin
  deposit(user: Address, amount: UInt64): void {
    assert(amount > UInt64.zero(), "Deposit amount must be greater than zero.");

    // Update user's balance
    const userBalance = this.deposits.get(user) || UInt64.zero();
    this.deposits.set(user, userBalance.add(amount));

    // Update total deposits
    this.totalDeposits = this.totalDeposits.add(amount);

    // Emit an event for deposit
    this.emitEvent("Deposit", { user, amount });
  }

  // Withdraw function: Allows a user to withdraw their deposit
  withdraw(user: Address, amount: UInt64): void {
    const userBalance = this.deposits.get(user) || UInt64.zero();
    assert(userBalance >= amount, "Insufficient balance.");

    // Update user's balance
    this.deposits.set(user, userBalance.sub(amount));

    // Update total deposits
    this.totalDeposits = this.totalDeposits.sub(amount);

    // Send Bitcoin back to the user
    Bitcoin.transfer(user, amount);

    // Emit an event for withdrawal
    this.emitEvent("Withdraw", { user, amount });
  }

  // View function: Check user's deposit balance
  checkBalance(user: Address): UInt64 {
    return this.deposits.get(user) || UInt64.zero();
  }

  // Link to yield optimizer: Allocate funds for yield generation
  optimizeYield(): void {
    assert(this.totalDeposits > UInt64.zero(), "No funds available for optimization.");
    
    // Call the external yield optimizer
    this.callContract(this.yieldOptimizer, "allocateFunds", [this.totalDeposits]);

    // Emit an event for optimization
    this.emitEvent("YieldOptimization", { totalDeposits: this.totalDeposits });
  }

  // Handle returns from yield optimizer
  receiveYield(user: Address, yieldAmount: UInt64): void {
    assert(yieldAmount > UInt64.zero(), "Yield amount must be greater than zero.");

    // Update user's balance with the yield
    const userBalance = this.deposits.get(user) || UInt64.zero();
    this.deposits.set(user, userBalance.add(yieldAmount));

    // Emit an event for yield received
    this.emitEvent("YieldReceived", { user, yieldAmount });
  }

  // View function: Check total deposits
  getTotalDeposits(): UInt64 {
    return this.totalDeposits;
  }
}

export default DepositContract;
