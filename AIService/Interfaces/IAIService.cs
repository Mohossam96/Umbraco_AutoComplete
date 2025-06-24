using System.Threading.Tasks;

namespace AIService.Interfaces
{
    public interface IAIService
    {
        Task<List<string>> GetSuggestionsAsync(string input);
    
        Task<string> GetRichTextSuggestionAsync(string input);
        Task<List<string>> GetTagSuggestionsAsync(string input);
        Task<string> ChatBotReply(string input);
    }
}
