using AIService.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text;

namespace AIService.Services

{
    public class AIService : IAIService
    {
        private readonly IConfiguration _configuration;

        public AIService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<string> GetRichTextSuggestionAsync(string input)
        {
            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var client = new HttpClient();
            // client.DefaultRequestHeaders.Add("api-key", "<your-azure-api-key>");
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


            var json = JsonConvert.SerializeObject(request);
            var response = await client.PostAsync(
                @$"{APIBaseUrl}?key={key}",
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            var result = await response.Content.ReadAsStringAsync();
            dynamic completion = JsonConvert.DeserializeObject(result);
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            suggestions = suggestions.Replace("```html", "").Replace("```", "").Trim();
            return suggestions;
        }

        public async Task<string> ChatBotReply(string input)
        {
            
            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var client = new HttpClient();
            // client.DefaultRequestHeaders.Add("api-key", "<your-azure-api-key>");
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


            var json = JsonConvert.SerializeObject(request);
            var response = await client.PostAsync(
                @$"{APIBaseUrl}?key={key}",
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            var result = await response.Content.ReadAsStringAsync();
            dynamic completion = JsonConvert.DeserializeObject(result);
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            suggestions = suggestions.Replace("```html", "").Replace("```", "").Trim();
            return suggestions;
        }

        public async Task<List<string>> GetSuggestionsAsync(string input)
        {
            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var client = new HttpClient();
            // client.DefaultRequestHeaders.Add("api-key", "<your-azure-api-key>");
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


            var json = JsonConvert.SerializeObject(request);
            var response = await client.PostAsync(
                $@"{APIBaseUrl}?key={key}",
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            var result = await response.Content.ReadAsStringAsync();
            dynamic completion = JsonConvert.DeserializeObject(result);
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            var listofSuggestions = suggestions.Split(',').ToList();
            return listofSuggestions;
        }
        public async Task<List<string>> GetTagSuggestionsAsync(string input)
        {
            var APIBaseUrl = _configuration["AIService:APIBaseUrl"];
            var key = _configuration["AIService:APIKey"];
            var client = new HttpClient();
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


            var json = JsonConvert.SerializeObject(request);
            var response = await client.PostAsync(
                $@"{APIBaseUrl}?key={key}",
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            var result = await response.Content.ReadAsStringAsync();
            dynamic completion = JsonConvert.DeserializeObject(result);
            var suggestions = ((string)completion.candidates[0].content.parts[0].text);
            var listofSuggestions = suggestions.Split(',').ToList();
            return listofSuggestions;
        }
    }
}
