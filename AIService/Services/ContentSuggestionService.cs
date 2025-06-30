using AIService.Interfaces;
using GAFI.SupportActivities.Helpers;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text;

namespace AIService.Services

{
    public class ContentSuggestionService : IContentSuggestionService
    {
        private readonly IConfiguration _configuration;

        public ContentSuggestionService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<ApiResult<string>> GetRichTextSuggestionAsync(string input)
        {
            var request = new
            {
                contents = new[]
                    {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = $@"Write a descriptive paragraph about: {input}.
                                        Do not ask questions, suggest alternatives, or include verbal phrases.
                                        Respond immediately with the content only.
                                        Format the output as valid HTML using <strong>, <em>, <p>, etc.
                                        Do not wrap the result in Markdown or code blocks like ```html.
"
                            }
                        }
                    }
                }
            };
            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var fullURL = @$"{APIBaseUrl}?key={key}";


            
            var ApiResponse =  ApiHelper<object>.Post(fullURL, request).GetAwaiter().GetResult();

        

            if(ApiResponse.StatusCode == (int)System.Net.HttpStatusCode.TooManyRequests)
            {
                return new ApiResult<string>() 
                {
                    Message = "You have exceeded the maximum number of requests. Please try again later." ,
                    StatusCode= (int)System.Net.HttpStatusCode.TooManyRequests
                };
            }
            dynamic completion = ApiResponse.Response;
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            suggestions = suggestions.Replace("```html", "").Replace("```", "").Trim();
            var res = new ApiResult<string>()
            {
                Response = suggestions,
                StatusCode = (int)System.Net.HttpStatusCode.OK,
            };
            return res;
        }

        public async Task<ApiResult<string>> ChatBotReply(string input)
        {
            
            var request = new
            {
                contents = new[]
                    {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = input

                            }
                        }
                    }
                }
            };


            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var fullURL = @$"{APIBaseUrl}?key={key}";



            var ApiResponse = ApiHelper<object>.Post(fullURL, request).GetAwaiter().GetResult();



            if (ApiResponse.StatusCode == (int)System.Net.HttpStatusCode.TooManyRequests)
            {
                return new ApiResult<string>()
                {
                    Message = "You have exceeded the maximum number of requests. Please try again later.",
                    StatusCode =  (int)System.Net.HttpStatusCode.TooManyRequests
                };
            }
            dynamic completion = ApiResponse.Response;
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            suggestions = suggestions.Replace("```html", "").Replace("```", "").Trim();
            var res = new ApiResult<string>()
            {
                Response = suggestions,
                StatusCode = (int)System.Net.HttpStatusCode.OK,
            };
            return res;
        }

        public async Task<ApiResult<List<string>>> GetSuggestionsAsync(string input)
        {
    
            var request = new
            {
                contents = new[]
                    {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = $@"Given the partial input, reply with a comma seprated list of 5 titles suggestions that best completes it, as if you're naming something (e.g., a product, concept, or project) , first suggestion 2 single word suggestions then the rest see what best fits it wheather 2 words or 1 suggestions. Do not ask questions, suggest alternatives, or include verbal phrases. Exclude special characters (like \n) and avoid introductions or explanations.  intput = {input}"
                            }
                        }
                    }
                }
            };

            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var fullURL = @$"{APIBaseUrl}?key={key}";



            var ApiResponse = ApiHelper<object>.Post(fullURL, request).GetAwaiter().GetResult();



            if (ApiResponse.StatusCode == (int)System.Net.HttpStatusCode.TooManyRequests)
            {
                return new ApiResult<List<string>>() 
                { 
                    Message="You have exceeded the maximum number of requests. Please try again later." ,
                    StatusCode=(int)System.Net.HttpStatusCode.TooManyRequests,


                
                };
            }
            dynamic completion = ApiResponse.Response;
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            suggestions = suggestions.Replace("```html", "").Replace("```", "").Trim();
            
           
            var listofSuggestions = suggestions.Split(',').ToList();
            var response = new ApiResult<List<string>>()
            {
                StatusCode = (int)System.Net.HttpStatusCode.OK,
                Response = listofSuggestions,
            };
            return response;
        }
        public async Task<ApiResult<List<string>>> GetTagSuggestionsAsync(string input)
        {
           
            var request = new
            {
                contents = new[]
                    {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = $@"Suggest 10 relevant tags for the following description. Separate each tag with a comma and respond with tags only — no extra text or explanation. Headline: {input}"
                            }
                        }
                    }
                }
            };



            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var fullURL = @$"{APIBaseUrl}?key={key}";



            var ApiResponse = ApiHelper<object>.Post(fullURL, request).GetAwaiter().GetResult();



            if (ApiResponse.StatusCode == (int)System.Net.HttpStatusCode.TooManyRequests)
            {
                return new ApiResult<List<string>>()
                {
                    Message = "You have exceeded the maximum number of requests. Please try again later.",
                    StatusCode = (int)System.Net.HttpStatusCode.TooManyRequests,



                };
            }
            dynamic completion = ApiResponse.Response;
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            suggestions = suggestions.Replace("```html", "").Replace("```", "").Trim();


            var listofSuggestions = suggestions.Split(',').ToList();
            var response = new ApiResult<List<string>>()
            {
                StatusCode = (int)System.Net.HttpStatusCode.OK,
                Response = listofSuggestions,
            };
            return response;
        }
    }
}
