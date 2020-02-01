// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using System.Threading.Tasks;
using Dapr;
using Microsoft.AspNetCore.Mvc;

namespace aspnetapp
{
    [ApiController]
    [Route("[controller]")]
    public class AccountsController : ControllerBase
    {
        [HttpGet("{account}")]
        public ActionResult<int> GetBalance(StateEntry<int?> account)
        {
            if (account.Value is null)
            {
                return this.NotFound();
            }

            return account.Value;
        }

        [HttpPost("{account}/deposit")]
        public async Task<ActionResult<int>> Deposit([FromRoute] StateEntry<int?> account, [FromBody] int amount)
        {
            account.Value ??= 0;
            account.Value += amount;

            await account.SaveAsync();

            return account.Value;
        }

        [HttpPost("{account}/withdraw")]
        public async Task<ActionResult<int>> Withdraw([FromRoute] StateEntry<int?> account, [FromBody] int amount)
        {
            account.Value ??= 0;
            account.Value -= amount;

            await account.SaveAsync();

            return account.Value;
        }
    }
}
