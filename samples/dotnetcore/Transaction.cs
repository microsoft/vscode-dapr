using System.Runtime.Serialization;

namespace App
{
    [DataContract]
    public sealed class Transaction
    {
        [DataMember(Name = "accountId")]
        public string AccountId { get; set; }

        [DataMember(Name = "amount")]
        public int Amount { get; set; }

        [DataMember(Name = "type")]
        public string Type { get; set; }
    }
}