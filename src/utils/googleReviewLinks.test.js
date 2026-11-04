import test from 'node:test';
import assert from 'node:assert/strict';
import { googleReviewLink } from './googleReviewLinks.js';

test('allows official Google review links',()=>{
 for(const url of ['https://g.page/r/ABC123/review','https://g.page/salon/review','https://search.google.com/local/writereview?placeid=ChIJ123','https://maps.app.goo.gl/AbC123','https://www.google.com/maps/place/Salon/'])assert.ok(googleReviewLink(url));
});
test('rejects other domains, script URLs, credentials and redirect endpoints',()=>{
 for(const url of ['http://g.page/r/ABC/review','javascript:alert(1)','https://g.page.evil.test/r/ABC/review','https://g.page@evil.test/r/ABC/review','https://evil@g.page/r/ABC/review','https://www.google.com/url?q=https://evil.test','https://search.google.com/local/writereview','https://g.page:8443/r/ABC/review',''])assert.equal(googleReviewLink(url),'');
});
