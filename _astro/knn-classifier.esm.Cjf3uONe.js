import{dI as x,dm as p,r as f,bQ as m,dN as d,L as C,cW as D,g as M,c as y}from"./index.D3l2ddWT.js";import"./_commonjsHelpers.gnU0ypJ3.js";/**
    * @license
    * Copyright 2023 Google LLC. All Rights Reserved.
    * Licensed under the Apache License, Version 2.0 (the "License");
    * you may not use this file except in compliance with the License.
    * You may obtain a copy of the License at
    *
    * http://www.apache.org/licenses/LICENSE-2.0
    *
    * Unless required by applicable law or agreed to in writing, software
    * distributed under the License is distributed on an "AS IS" BASIS,
    * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    * See the License for the specific language governing permissions and
    * limitations under the License.
    * =============================================================================
    *//*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */function E(n,e,t,s){function i(a){return a instanceof t?a:new t(function(o){o(a)})}return new(t||(t=Promise))(function(a,o){function l(c){try{r(s.next(c))}catch(h){o(h)}}function u(c){try{r(s.throw(c))}catch(h){o(h)}}function r(c){c.done?a(c.value):i(c.value).then(l,u)}r((s=s.apply(n,[])).next())})}function w(n,e){var t={label:0,sent:function(){if(a[0]&1)throw a[1];return a[1]},trys:[],ops:[]},s,i,a,o;return o={next:l(0),throw:l(1),return:l(2)},typeof Symbol=="function"&&(o[Symbol.iterator]=function(){return this}),o;function l(r){return function(c){return u([r,c])}}function u(r){if(s)throw new TypeError("Generator is already executing.");for(;t;)try{if(s=1,i&&(a=r[0]&2?i.return:r[0]?i.throw||((a=i.return)&&a.call(i),0):i.next)&&!(a=a.call(i,r[1])).done)return a;switch(i=0,a&&(r=[r[0]&2,a.value]),r[0]){case 0:case 1:a=r;break;case 4:return t.label++,{value:r[1],done:!1};case 5:t.label++,i=r[1],r=[0];continue;case 7:r=t.ops.pop(),t.trys.pop();continue;default:if(a=t.trys,!(a=a.length>0&&a[a.length-1])&&(r[0]===6||r[0]===2)){t=0;continue}if(r[0]===3&&(!a||r[1]>a[0]&&r[1]<a[3])){t.label=r[1];break}if(r[0]===6&&t.label<a[1]){t.label=a[1],a=r;break}if(a&&t.label<a[2]){t.label=a[2],t.ops.push(r);break}a[2]&&t.ops.pop(),t.trys.pop();continue}r=e.call(n,t)}catch(c){r=[6,c],i=0}finally{s=a=0}if(r[0]&5)throw r[1];return{value:r[0]?r[1]:void 0,done:!0}}}/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */function g(n,e){return n==null&&e==null?null:n==null?e.clone():e===null?n.clone():m([n,e],0)}function T(n,e){for(var t=[],s=0;s<n.length;s++)t.push({value:n[s],index:s});t.sort(function(o,l){return l.value-o.value});for(var i=new Float32Array(e),a=new Int32Array(e),s=0;s<e;s++)i[s]=t[s].value,a[s]=t[s].index;return{values:i,indices:a}}/** @license See the LICENSE file. */var z="1.2.6",N=(function(){function n(){this.classDatasetMatrices={},this.classExampleCount={},this.labelToClassId={},this.nextClassId=0}return n.prototype.addExample=function(e,t){var s=this;if(this.exampleShape==null&&(this.exampleShape=e.shape),!x(this.exampleShape,e.shape))throw new Error("Example shape provided, ".concat(e.shape," does not match ")+"previously provided example shapes ".concat(this.exampleShape,"."));this.clearTrainDatasetMatrix(),t in this.labelToClassId||(this.labelToClassId[t]=this.nextClassId++),p(function(){var i=s.normalizeVectorToUnitLength(f(e,[e.size])),a=i.shape[0];if(s.classDatasetMatrices[t]==null)s.classDatasetMatrices[t]=f(i,[1,a]);else{var o=m([f(s.classDatasetMatrices[t],[s.classExampleCount[t],a]),f(i,[1,a])],0);s.classDatasetMatrices[t].dispose(),s.classDatasetMatrices[t]=o}d(s.classDatasetMatrices[t]),s.classExampleCount[t]==null&&(s.classExampleCount[t]=0),s.classExampleCount[t]++})},n.prototype.similarities=function(e){var t=this;return p(function(){var s=t.normalizeVectorToUnitLength(f(e,[e.size])),i=s.shape[0];if(t.trainDatasetMatrix==null){var a=null;for(var o in t.classDatasetMatrices)a=g(a,t.classDatasetMatrices[o]);t.trainDatasetMatrix=a}if(t.trainDatasetMatrix==null)return console.warn("Cannot predict without providing training examples."),null;d(t.trainDatasetMatrix);var l=t.getNumExamples();return f(C(f(t.trainDatasetMatrix,[l,i]),f(s,[i,1])),[l])})},n.prototype.predictClass=function(e,t){return t===void 0&&(t=3),E(this,void 0,void 0,function(){var s,i,a,o,l=this;return w(this,function(u){switch(u.label){case 0:if(t<1)throw new Error("Please provide a positive integer k value to predictClass.");if(this.getNumExamples()===0)throw new Error("You have not added any examples to the KNN classifier. Please add examples before calling predictClass.");return s=p(function(){return y(l.similarities(e),"float32")}),i=Math.min(t,this.getNumExamples()),o=T,[4,s.data()];case 1:return a=o.apply(void 0,[u.sent(),i]).indices,s.dispose(),[2,this.calculateTopClass(a,i)]}})})},n.prototype.clearClass=function(e){if(this.classDatasetMatrices[e]==null)throw new Error("Cannot clear invalid class ".concat(e));this.classDatasetMatrices[e].dispose(),delete this.classDatasetMatrices[e],delete this.classExampleCount[e],this.clearTrainDatasetMatrix()},n.prototype.clearAllClasses=function(){for(var e in this.classDatasetMatrices)this.clearClass(e)},n.prototype.getClassExampleCount=function(){return this.classExampleCount},n.prototype.getClassifierDataset=function(){return this.classDatasetMatrices},n.prototype.getNumClasses=function(){return Object.keys(this.classExampleCount).length},n.prototype.setClassifierDataset=function(e){this.clearTrainDatasetMatrix(),this.classDatasetMatrices=e;for(var t in e)this.classExampleCount[t]=e[t].shape[0]},n.prototype.calculateTopClass=function(e,t){var s,i={};if(e==null)return{classIndex:this.labelToClassId[s],label:s,confidences:i};var a={},o=0;for(var l in this.classDatasetMatrices)o+=this.classExampleCount[l],a[l]=o;var u={};for(var l in this.classDatasetMatrices)u[l]=0;for(var r=0;r<e.length;r++){var c=e[r];for(var l in this.classDatasetMatrices)if(c<a[l]){u[l]++;break}}var h=0;for(var l in this.classDatasetMatrices){var v=u[l]/t;v>h&&(h=v,s=l),i[l]=v}return{classIndex:this.labelToClassId[s],label:s,confidences:i}},n.prototype.clearTrainDatasetMatrix=function(){this.trainDatasetMatrix!=null&&(this.trainDatasetMatrix.dispose(),this.trainDatasetMatrix=null)},n.prototype.normalizeVectorToUnitLength=function(e){return p(function(){var t=D(e);return M(e,t)})},n.prototype.getNumExamples=function(){var e=0;for(var t in this.classDatasetMatrices)e+=this.classExampleCount[t];return e},n.prototype.dispose=function(){this.clearTrainDatasetMatrix();for(var e in this.classDatasetMatrices)this.classDatasetMatrices[e].dispose()},n})();function S(){return new N}export{N as KNNClassifier,S as create,z as version};
