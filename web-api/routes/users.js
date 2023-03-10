const express = require('express');
const fetch = require('../../common/fetchHelper');

const { GRAPH_ME_ENDPOINT } = require('../authConfig');

// initialize router
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        // const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.oboToken);
        
        const dummyResponse = {
            "displayName": "John Doe",
            "givenName": "John",
            "jobTitle": "Senior Researcher",
            "mail": "",
            "mobilePhone": null,
            "officeLocation": null,
        };

        res.send(dummyResponse);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = router;