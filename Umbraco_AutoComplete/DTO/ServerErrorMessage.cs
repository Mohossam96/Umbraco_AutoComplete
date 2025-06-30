using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LinkDev.UmbracoBase.Common.Common
{
    public class ServerErrorMessage
    {
        public string Message { get; set; }

        public string TraceId { get; set; }

        public int Status { get; set; }
    }
}
