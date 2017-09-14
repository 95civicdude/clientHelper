var request = require('request');

exports.getProductResults = function (req, res) {

    function constructUrl(clientName) {
        
        var host = 'https://catalog-lookup-service-bazaar.prod.us-east-1.nexus.bazaarvoice.com/1/catalog/health/client/' + clientName + '/gtin?apikey=cd-catalog-services-bazaar-xwAMrJx5Gh605tfs',
            args = {};

        return host;
    }

    request.get(constructUrl(req.query.clientName), function (error, response, body) {

        if (!error && response.statusCode === 200) {
            res.type('application/javascript');
            res.jsonp({
                'statusCode': 200,
                'statistics'     : JSON.parse(body).statistics
            });
        } else {
            console.error(error);
        }
    });  
};