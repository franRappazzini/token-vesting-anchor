"use client";

import { useMemo, useState } from "react";
import { useTokenvestingProgram, useTokenvestingProgramAccount } from "./tokenvesting-data-access";

import { PublicKey } from "@solana/web3.js";
import { TOKENVESTING_PROGRAM_ID } from "@project/anchor";
import { web3 } from "@coral-xyz/anchor";

interface CreateEmployeeAccoutInitialParams {
  startTime: number;
  endTime: number;
  cliffTime: number;
  totalAmount: number;
  beneficiary: string;
  // mint?: string;
}

export function TokenvestingCreate() {
  const { createVestingAccount } = useTokenvestingProgram();
  const [companyName, setCompanyName] = useState("");
  const [mint, setMint] = useState("");

  const handleSubmit = () => createVestingAccount.mutateAsync({ companyName, mint });

  return (
    <section className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <h2 className="card-title">Create Tokenvesting Account</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input input-bordered w-full max-w-xs"
          />
          <input
            type="text"
            placeholder="Mint Address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            className="input input-bordered w-full max-w-xs"
          />
          <button
            className="btn btn-xs lg:btn-md btn-outline"
            onClick={handleSubmit}
            disabled={createVestingAccount.isPending}
          >
            Create
          </button>
        </div>
      </div>
    </section>
  );
}

export function TokenvestingList() {
  const { accounts, getProgramAccount } = useTokenvestingProgram();

  const [treasuryTokenAccount] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vesting_treasury"), Buffer.from("FrancisCompany")],
    TOKENVESTING_PROGRAM_ID
  );

  console.log("treasuryTokenAccount", treasuryTokenAccount.toString());

  // console.log(
  //   TOKEN_PROGRAM_ID.toString(),
  //   "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //   TOKEN_PROGRAM_ID.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  // );
  // console.log(
  //   TOKENVESTING_PROGRAM_ID.toString(),
  //   "Fmcb3arTrfLuJnzfLA6JeHhX93DKe63CuLBQMLcQnvDq",
  //   TOKENVESTING_PROGRAM_ID.toString() === "Fmcb3arTrfLuJnzfLA6JeHhX93DKe63CuLBQMLcQnvDq"
  // );

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and are on the correct
          cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <TokenvestingCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function TokenvestingCard({ account }: { account: PublicKey }) {
  const { accountQuery, createEmployeeAccount, claimTokensVesting } = useTokenvestingProgramAccount(
    {
      account,
    }
  );
  const [initialParams, setInitialParams] = useState<CreateEmployeeAccoutInitialParams>({
    startTime: 0,
    endTime: 0,
    cliffTime: 0,
    totalAmount: 0,
    beneficiary: "",
  });

  const companyName = useMemo(
    () => accountQuery.data?.companyName ?? 0,
    [accountQuery.data?.companyName]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInitialParams((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? parseInt(value) : value,
    }));
  };
  const handleSubmit = () => createEmployeeAccount.mutateAsync({ ...initialParams });
  const handleClaim = () => claimTokensVesting.mutateAsync({ companyName: companyName.toString() });

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <section>
      <div className="card card-bordered border-base-300 border-4 text-neutral-content">
        <div className="card-body items-center text-center">
          <div className="space-y-6">
            {/*    <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            {count}
          </h2>
          <div className="card-actions justify-around">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => incrementMutation.mutateAsync()}
              disabled={incrementMutation.isPending}
            >
              Increment
            </button>
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => {
                const value = window.prompt("Set value to:", count.toString() ?? "0");
                if (!value || parseInt(value) === count || isNaN(parseInt(value))) {
                  return;
                }
                return setMutation.mutateAsync(parseInt(value));
              }}
              disabled={setMutation.isPending}
            >
              Set
            </button>
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => decrementMutation.mutateAsync()}
              disabled={decrementMutation.isPending}
            >
              Decrement
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (!window.confirm("Are you sure you want to close this account?")) {
                  return;
                }
                return closeMutation.mutateAsync();
              }}
              disabled={closeMutation.isPending}
            >
              Close
            </button>
          </div> */}

            <h2
              className="card-title justify-center text-3xl cursor-pointer"
              onClick={() => accountQuery.refetch()}
            >
              {companyName}
            </h2>

            <h2 className="card-title">Create Employee Account</h2>

            <div className="space-y-4">
              <input
                type="text"
                name="startTime"
                placeholder="Start Time"
                value={initialParams.startTime}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
              <input
                type="text"
                name="endTime"
                placeholder="End Time"
                value={initialParams.endTime}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
              <input
                type="text"
                name="cliffTime"
                placeholder="Cliff Time"
                value={initialParams.cliffTime}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
              <input
                type="text"
                name="totalAmount"
                placeholder="Total Amount"
                value={initialParams.totalAmount}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
              <input
                type="text"
                name="beneficiary"
                placeholder="Beneficiary Address"
                value={initialParams.beneficiary}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
              <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={handleSubmit}
                disabled={createEmployeeAccount.isPending}
              >
                Create Employee Account
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="card-title">Check Claim Tokens</h2>
          <button
            className="btn btn-xs lg:btn-md btn-outline"
            onClick={handleClaim}
            disabled={claimTokensVesting.isPending}
          >
            Claim Tokens
          </button>
        </div>
      </div>
    </section>
  );
}
