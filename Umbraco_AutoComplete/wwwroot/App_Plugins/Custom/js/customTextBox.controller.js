//angular.module("umbraco").controller("CustomTextBoxController", function ($scope) {
//    debugger
//    // Initialize the model if it doesn't exist
//    if (!$scope.model.value) {
//        $scope.model.value = "";
//    }

//    // Watch for changes in the model value
//    $scope.$watch('model.value', function (newValue) {
//        if (newValue !== undefined) {
//            // You can add custom validation or transformation logic here
//            $scope.model.value = newValue;
//        }
//    });
//}); 

angular.module("umbraco").controller("CustomTextBoxController", textboxController);
function textboxController($scope, validationMessageService) {
    function checkLengthVadility() {
        $scope.validLength = $scope.charsCount <= $scope.maxChars
    }
    $scope.model.config || ($scope.model.config = {}),
        $scope.maxChars = Math.min($scope.model.config.maxChars || 512, 512),
        $scope.charsCount = 0,
        $scope.nearMaxLimit = !1,
        $scope.validLength = !0,
        $scope.$on("formSubmitting", function () {
            !0 === $scope.validLength ? $scope.textboxFieldForm.textbox.$setValidity("maxChars", !0) : $scope.textboxFieldForm.textbox.$setValidity("maxChars", !1)
        }),
        $scope.change = function () {
            $scope.model.value ? ($scope.charsCount = $scope.model.value.length,
                checkLengthVadility(),
                $scope.nearMaxLimit = $scope.validLength && $scope.charsCount > Math.max(.8 * $scope.maxChars, $scope.maxChars - 25)) : ($scope.charsCount = 0,
                    checkLengthVadility())
        }
        ,
        $scope.model.onValueChanged = $scope.change,
        $scope.change(),
        validationMessageService.getMandatoryMessage($scope.model.validation).then(function (value) {
            $scope.mandatoryMessage = value
        })
}