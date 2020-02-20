// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System.Threading.Tasks;
using Dapr;
using Microsoft.AspNetCore.Mvc;

namespace App
{
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private const string StateStore = "statestore";

        [HttpGet("{account}")]
        public ActionResult<int> GetBalance([FromState(StateStore)] StateEntry<int?> account)
        {
            if (account.Value is null)
            {
                return this.NotFound();
            }

            return account.Value;
        }

        [HttpPost("{account}/deposit")]
        public async Task<ActionResult<int>> Deposit([FromState(StateStore)] [FromRoute] StateEntry<int?> account, [FromBody] int amount)
        {
            account.Value ??= 0;
            account.Value += amount;

            await account.SaveAsync();

            return account.Value;
        }

        [HttpPost("{account}/withdraw")]
        public async Task<ActionResult<int>> Withdraw([FromState(StateStore)] [FromRoute] StateEntry<int?> account, [FromBody] int amount)
        {
            account.Value ??= 0;
            account.Value -= amount;

            await account.SaveAsync();

            return account.Value;
        }

        [Topic("transaction")]
        [HttpPost("transaction")]
        public async Task<ActionResult<int>> Transaction(Transaction transaction, [FromServices] StateClient stateClient)
        {
            var account = await stateClient.GetStateEntryAsync<int?>(StateStore, transaction.AccountId);

            switch (transaction.Type)
            {
                case "deposit": return await this.Deposit(account, transaction.Amount);
                case "withdraw": return await this.Withdraw(account, transaction.Amount);
                default:
                    return this.NotFound();
            }
        }
    }
}
