namespace Umbraco_AutoComplete.Services
{
    public interface IAIService
    {
        Task<List<string>> GetSuggestionsAsync(string input);
    
        Task<string> GetRichTextSuggestionAsync(string input);
    }
}
