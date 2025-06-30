using LinkDev.UmbracoBase.Common.Common;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text;


namespace LinkDev.UmbracoBase.Web.Helpers
{
    public class ResponseMessageHelper
    {
        public static JsonResult BadRequest(IEnumerable<string> errorMessages)
        {
            ResponseMessage<object> response = new ResponseMessage<object>((int)HttpStatusCode.BadRequest)
            {
                Notifications = errorMessages
            };

            return new JsonResult(response) { StatusCode = response.Status };
        }

        public static JsonResult BadRequest<T>(ResponseMessage<T> response, string className, string methodName, ILogger logger, Guid correlationId)
        {
            //logger.LogError(Resources.Common.BadRequest, className, methodName, correlationId, sourceType);

            response.Status = (int)HttpStatusCode.BadRequest;

            return new JsonResult(response) { StatusCode = response.Status };
        }
        public static JsonResult GetResult<T>(ResponseMessage<T> response,HttpStatusCode statusCode)
        {
            //logger.LogError(Resources.Common.BadRequest, className, methodName, correlationId, sourceType);

            response.Status = (int)statusCode;

            return new JsonResult(response) { StatusCode = response.Status };
        }

        public static JsonResult ServerError<T>(ResponseMessage<T> response, string className, string methodName, ILogger logger, Guid correlationId)
        {
            ServerErrorMessage errorMessage = new ServerErrorMessage()
            {
                TraceId = correlationId.ToString(),
                Message ="Internal Server Error",// Resources.Common.InternalServerError,
                Status = (int)HttpStatusCode.InternalServerError
            };

            if (response.Notifications != null && response.Notifications.Any())
            {
                StringBuilder msgBuilder = new StringBuilder();
                msgBuilder.AppendLine(errorMessage.Message);

                foreach (string notification in response.Notifications)
                {
                    msgBuilder.AppendLine(notification);
                }
              //  logger.LogError(msgBuilder.ToString(), className, methodName, correlationId, sourceType);
            }
            else
            {
               // logger.LogError(errorMessage.Message, className, methodName, correlationId, sourceType);
            }

            return new JsonResult(errorMessage) { StatusCode = errorMessage.Status };
        }

        /// <summary>
        /// Return Json Result with StatusCode InternalServerError 500
        /// </summary>
        /// <param name="exp"></param>
        /// <param name="logEvent">Contains class or method name that throw this exception</param>
        /// <returns></returns>
        public static JsonResult ServerError(Exception exp, ILogger logger, ILogger className, string methodName, Guid correlationId)
        {
            ServerErrorMessage errorMessage = new ServerErrorMessage()
            {
                TraceId = correlationId.ToString(),
                Message = "Internal server error",
                Status = (int)HttpStatusCode.InternalServerError
            };

            //logger.LogException(exp, className, methodName, correlationId, sourceType);

            return new JsonResult(errorMessage) { StatusCode = errorMessage.Status };
        }

        public static JsonResult Ok<T>(ResponseMessage<T> response)
        {
            response.Status = (int)HttpStatusCode.OK;

            return new JsonResult(response) { StatusCode = response.Status };
        }

        public static JsonResult Ok<T>(T data, IEnumerable<string> notifications = null)
        {
            ResponseMessage<T> response = new ResponseMessage<T>((int)HttpStatusCode.OK)
            {
                Data = data,
                Notifications = notifications
            };

            return new JsonResult(response) { StatusCode = response.Status };
        }

        public static JsonResult Forbid(string[] errorMessages)
        {
            int status = (int)HttpStatusCode.Forbidden;
            ResponseMessage<object> response = new ResponseMessage<object>(status)
            {
                Notifications = errorMessages
            };

            return new JsonResult(response) { StatusCode = status };
        }

    }
}
