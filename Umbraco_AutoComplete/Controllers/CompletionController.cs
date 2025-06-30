using AIService.Interfaces;
using GAFI.SupportActivities.Helpers;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using Umbraco_AutoComplete.DTO;

namespace Umbraco_AutoComplete.Controllers
{
    [PluginController("AIHelper")]
    public class CompletionController : UmbracoAuthorizedApiController
    {
        private readonly IAIService _aiService;
        public CompletionController(IAIService aiService)
        {
            _aiService = aiService;
        }
        [HttpPost]
        public async Task<ApiResult<List<string>>> GetSuggestion(string input)
        {
            #region old 
            // var client = new HttpClient();
            //// client.DefaultRequestHeaders.Add("api-key", "<your-azure-api-key>");
            // var request = new
            //             {
            //                 contents = new[]
            //         {
            //         new
            //         {
            //             parts = new[]
            //             {
            //                 new
            //                 {
            //                     text = $@"Given the partial input, reply with a single title suggestion that best completes it, as if you're naming something (e.g., a product, concept, or project). Do not ask questions, suggest alternatives, or include verbal phrases. Exclude special characters (like \n) and avoid introductions or explanations.  intput = {input}"
            //                 }
            //             }
            //         }
            //     }
            //             };


            // var json = JsonConvert.SerializeObject(request);
            // var response = await client.PostAsync(
            //     @"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDJfBCUTgFUI4kv1RxM40a1khn8WYYQb4I",
            //     new StringContent(json, Encoding.UTF8, "application/json")
            // );

            // var result = await response.Content.ReadAsStringAsync();
            // dynamic completion = JsonConvert.DeserializeObject(result);
            // return ((string)completion.candidates[0].content.parts[0].text).Trim();
            #endregion
            return await _aiService.GetSuggestionsAsync(input);
        }

        [HttpPost]

        public async Task<ApiResult<List<string>>> GetTagSuggestion(RequestDTO request)
        {
            return await _aiService.GetTagSuggestionsAsync(request.input);
        }
        [HttpPost]
        public async Task<ApiResult<string>> GetRichTextSuggestion(string input)
        {
           
            return await _aiService.GetRichTextSuggestionAsync(input);
        }
        [HttpPost]
        public async Task<ApiResult<string>> GetChatReply(RequestDTO request)
        {
            return await _aiService.ChatBotReply(request.input);
        }
       
    }

}
