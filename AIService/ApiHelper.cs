using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace GAFI.SupportActivities.Helpers
{
    public class ApiResult<T>
    {
        public int StatusCode { get; set; }

        public T Response { get; set; }

        public string Message { get; set; }

    }
    public class ApiHelper<T>
    {
        public static async Task<ApiResult<T>> Post(string url, object requestBody)
        {
            ApiResult<T> restApiResponse = new ApiResult<T>();
            try
            {
                //if (url.Contains("https"))
                //{
                //    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls12 | SecurityProtocolType.Ssl3;
                //}

                HttpClient httpClient = new HttpClient();
                HttpContent content;
                if (requestBody is string)
                {
                    content = new StringContent((string)requestBody, Encoding.UTF8, "application/json");
                }
                else
                {
                    string json = Newtonsoft.Json.JsonConvert.SerializeObject(requestBody);
                    content = new StringContent(json, Encoding.UTF8, "application/json");
                }
                
                var result = await httpClient.PostAsync(url, content);

                var response = await result.Content.ReadAsStringAsync();
                if (result.StatusCode == HttpStatusCode.OK)
                {
                    if (!string.IsNullOrEmpty(response) && response.ToLower() == "exception") 
                    {
                        restApiResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                        return restApiResponse;
                    }
                    restApiResponse.Response = Newtonsoft.Json.JsonConvert.DeserializeObject<T>(response);
                }
                restApiResponse.StatusCode = (int)result.StatusCode;

                return restApiResponse;
            }
            catch (Exception exp)
            {
                throw exp;
            }
        }
    }
}