
using Newtonsoft.Json;
using System.Text;

namespace Umbraco_AutoComplete.Services
{
    public class AIService : IAIService
    {
        public Task<string> GetRichTextSuggestionAsync(string input)
        {
            throw new NotImplementedException();
        }

        public async Task<List<string>> GetSuggestionsAsync(string input)
        {
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
                @"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDJfBCUTgFUI4kv1RxM40a1khn8WYYQb4I",
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            var result = await response.Content.ReadAsStringAsync();
            dynamic completion = JsonConvert.DeserializeObject(result);
            var suggestions = ((string)completion.candidates[0].content.parts[0].text).Trim();
            var listofSuggestions = suggestions.Split(',').ToList();
            return listofSuggestions;
        }
    }
}
