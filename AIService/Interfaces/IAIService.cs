using GAFI.SupportActivities.Helpers;
using System.Threading.Tasks;

namespace AIService.Interfaces
{
    public interface IAIService
    {
        Task<ApiResult<List<string>>> GetSuggestionsAsync(string input);
    
        Task<ApiResult<string>> GetRichTextSuggestionAsync(string input);
        Task<ApiResult<List<string>>> GetTagSuggestionsAsync(string input);
        Task<ApiResult<string>> ChatBotReply(string input);
    }
}
