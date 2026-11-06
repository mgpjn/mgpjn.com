import assert from 'node:assert/strict';
import {getProductPricing,getWholesalePriceForUser} from '../src/utils/pricing.js';
const assigned={id:86,price:190,retail_price:190,mrp:210,wholesale_price:700,sd_price:27,dist_price:35,subd_price:45,retailer_price:55,is_assigned:true};
for(const role of ['customer','customer_layer_1','customer_layer_2','customer_layer_3','customer_1','customer_2','customer_3','',null,'unknown']){
 const p=getProductPricing(assigned,{role});
 assert.equal(p.retailPrice,190);assert.equal(p.wholesaleAllowed,false,`Customer must not see wholesale: ${role}`);assert.equal(p.wholesalePrice,0);assert.equal(getWholesalePriceForUser(assigned,{role}),0);
}
assert.equal(getProductPricing(assigned,null).wholesaleAllowed,false);
for(const [role,expected] of Object.entries({admin:700,super_admin:700,super_distributor:27,distributor:35,sub_distributor:45,retailer:55,sub_retailer:55,member:55}))assert.equal(getProductPricing(assigned,{role}).wholesalePrice,expected,`Partner rate preserved: ${role}`);
assert.equal(getProductPricing({...assigned,sd_price:0},{role:'super_distributor'}).wholesalePrice,700);
console.log('PASS: assigned products never expose wholesale prices to customers; partner pricing preserved.');
