package com.infobip.sms;

import com.infobip.ApiClient;
import com.infobip.ApiException;
import com.infobip.ApiKey;
import com.infobip.BaseUrl;
import com.infobip.api.SmsApi;
import com.infobip.model.SmsAdvancedTextualRequest;
import com.infobip.model.SmsDestination;
import com.infobip.model.SmsTextualMessage;

import java.util.Collections;

 */
public class SendSmsLib {


    public static void main(String[] args) {
        // Create the API client and the Send SMS API instances.
        var apiClient = ApiClient.forApiKey(ApiKey.from(process.env.API_KEY))
                .withBaseUrl(BaseUrl.from(process.env.BASE_URL))
                .build();
        var sendSmsApi = new SmsApi(apiClient);

        // Create a message to send.
        var smsMessage = new SmsTextualMessage()
                .addDestinationsItem(new SmsDestination().to(process.env.RECIPIENT))
                .text("Hello from Infobip Java Client!");

        // Create a send message request.
        var smsMessageRequest = new SmsAdvancedTextualRequest()
                .messages(Collections.singletonList(smsMessage));

        try {
            // Send the message.
            var smsResponse = sendSmsApi.sendSmsMessage(smsMessageRequest).execute();
            System.out.println("Response body: " + smsResponse);

            // Get delivery reports. It may take a few seconds to show the above-sent message.
            var reportsResponse = sendSmsApi.getOutboundSmsMessageDeliveryReports().execute();
            System.out.println(reportsResponse.getResults());
        } catch (ApiException e) {
            System.out.println("HTTP status code: " + e.responseStatusCode());
            System.out.println("Response body: " + e.rawResponseBody());
        }
    }
}
