angular.module("umbraco").controller("autoCompleteTitleController", function ($scope, $http, $timeout, notificationsService) {
    let debounceTimeout;
    $scope.suggestion = [];

    $scope.onTitleChange = function () {
        if (debounceTimeout) $timeout.cancel(debounceTimeout);
        debounceTimeout = $timeout(() => {
            if (!$scope.model.value) {
                $scope.suggestion = [];
                return
            };
           
           
            $http.post("/umbraco/backoffice/AIHelper/Completion/GetSuggestion?input="+ $scope.model.value)
                .then(res => {
                    if (res.data.StatusCode === 429) {

                        // pop up message in umbraco back office



                        notificationsService.error('You have reached the maximum number of requests for today. Please try again later.');
                        return;
                    }
                    $scope.suggestion = res.data.Response;
                });
        }, 500);
    };

    $scope.applySuggestion = function (item) {
        if (item) {
            $scope.model.value = item;
            $scope.suggestion = [];
        }
    };
});
