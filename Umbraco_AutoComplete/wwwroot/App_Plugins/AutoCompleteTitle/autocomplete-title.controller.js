angular.module("umbraco").controller("autoCompleteTitleController", function ($scope, $http, $timeout) {
    let debounceTimeout;
    $scope.suggestion = [];

    $scope.onTitleChange = function () {
        if (debounceTimeout) $timeout.cancel(debounceTimeout);
        debounceTimeout = $timeout(() => {
            if (!$scope.model.value) {
                $scope.suggestion = [];
                return
            };
            console.log("Fetching suggestion for:", $scope.model.value);
           
            $http.post("/umbraco/backoffice/AIHelper/Completion/GetSuggestion?input="+ $scope.model.value)
                .then(res => {

                    $scope.suggestion = res.data;
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
