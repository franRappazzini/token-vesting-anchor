import * as anchor from "@coral-xyz/anchor";

import { BanksClient, Clock, ProgramTestContext, startAnchor } from "solana-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
// @ts-expect-error - Correct import
import { createMint, mintTo } from "spl-token-bankrun";

import { BankrunProvider } from "anchor-bankrun";
import IDL from "../target/idl/tokenvesting.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Tokenvesting } from "@project/anchor";

describe("Vesting Smart Contract", () => {
  const companyName = "Test Company";
  let beneficiary: Keypair;
  let employer: Keypair;
  let provider: BankrunProvider;
  let program: anchor.Program<Tokenvesting>;
  let program2: anchor.Program<Tokenvesting>;
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let mint: PublicKey;
  let beneficiaryProvider: BankrunProvider;
  let vestingAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let employeeAccount: PublicKey;

  // setting up the test environment
  beforeAll(async () => {
    beneficiary = anchor.web3.Keypair.generate();

    context = await startAnchor(
      "",
      [{ name: "tokenvesting", programId: new PublicKey(IDL.address) }],
      [
        {
          address: beneficiary.publicKey,
          info: {
            lamports: 1000000000,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
      ]
    );

    console.log("context created");

    provider = new BankrunProvider(context);
    anchor.setProvider(provider);

    program = new anchor.Program<Tokenvesting>(IDL as Tokenvesting, provider);

    banksClient = context.banksClient;

    employer = provider.wallet.payer;

    mint = await createMint(banksClient, employer, employer.publicKey, null, 9);

    console.log("token created");

    beneficiaryProvider = new BankrunProvider(context);
    beneficiaryProvider.wallet = new NodeWallet(beneficiary);

    program2 = new anchor.Program<Tokenvesting>(IDL as Tokenvesting, beneficiaryProvider);

    [vestingAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(companyName)],
      program.programId
    );

    [treasuryTokenAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_treasury"), Buffer.from(companyName)],
      program.programId
    );

    [employeeAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("employee_vesting"),
        beneficiary.publicKey.toBuffer(),
        vestingAccount.toBuffer(),
      ],
      program.programId
    );
  });

  it("Create Vesting Account", async () => {
    const tx = await program.methods
      .createVestingAccount(companyName)
      .accounts({
        signer: employer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transaction Signature", tx);

    const vestingAccountData = await program.account.vestingAccount.fetch(vestingAccount);

    console.log("Vesting Account Data", vestingAccountData);

    expect(vestingAccountData.companyName).toEqual(companyName);

    console.log("vesting account address:", vestingAccount.toBase58());
  });

  it("Funding treasury token account", async () => {
    const amount = 10000 * 10 ** 9;

    // async function mintTo(banksClient, payer, mint, destination, authority, amount, multiSigners = [], programId = token.TOKEN_PROGRAM_ID) {

    const tx = await mintTo(banksClient, employer, mint, treasuryTokenAccount, employer, amount);

    console.log("Transaction Signature", tx);
  });

  it("Create Employee Account", async () => {
    /* start_time: i64,
        end_time: i64,
        cliff_time: i64, 
        total_amount: u64,
    */
    const tx = await program.methods
      .createEmployeeAccount(
        bn(1713208425), // Mon Apr 15 2024 19:13:45 GMT+0000
        bn(1747422825), // Fri May 16 2025 19:13:45 GMT+0000
        bn(1723208425), // Fri Aug 09 2024 13:00:25 GMT+0000
        bn(1000)
      )
      .accounts({
        beneficiary: beneficiary.publicKey,
        vestingAccount,
      })
      .rpc();

    console.log("Transaction Signature", tx);

    const employeeAccountData = await program.account.employeeAccount.fetch(employeeAccount);

    console.log("Employee Account Data", employeeAccountData);

    expect(employeeAccountData.beneficiary).toEqual(beneficiary.publicKey);
    expect(employeeAccountData.totalAmount.toNumber()).toEqual(1000);

    console.log("employee account address:", employeeAccount.toBase58());
  });

  it("Claim tokens", async () => {
    const currentClock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        currentClock.unixTimestamp
      )
    );

    console.log("Current Clock", currentClock);

    const tx = await program2.methods
      .claimTokensVesting(companyName)
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      //   .signers([beneficiary])
      .rpc();

    console.log("Transaction Signature", tx);

    const employeeAccountData = await program.account.employeeAccount.fetch(employeeAccount);

    console.log("Employee Account Data", employeeAccountData);

    expect(employeeAccountData.totalWithdrawn.toNumber()).toBeGreaterThan(0);
  });
});

function bn(n: number) {
  return new anchor.BN(n);
}
