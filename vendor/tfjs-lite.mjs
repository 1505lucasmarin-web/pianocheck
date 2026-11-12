var jk=Object.create;var Um=Object.defineProperty;var Yk=Object.getOwnPropertyDescriptor;var Zk=Object.getOwnPropertyNames;var Qk=Object.getPrototypeOf,Jk=Object.prototype.hasOwnProperty;var Ue=(r,t)=>()=>{try{return t||r((t={exports:{}}).exports,t),t.exports}catch(e){throw t=0,e}},At=(r,t)=>{for(var e in t)Um(r,e,{get:t[e],enumerable:!0})},tE=(r,t,e,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of Zk(t))!Jk.call(r,n)&&n!==e&&Um(r,n,{get:()=>t[n],enumerable:!(o=Yk(t,n))||o.enumerable});return r};var Hm=(r,t,e)=>(e=r!=null?jk(Qk(r)):{},tE(t||!r||!r.__esModule?Um(e,"default",{value:r,enumerable:!0}):e,r));var hg=Ue((sW,dg)=>{dg.exports=zt;var Ke=null;try{Ke=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch{}function zt(r,t,e){this.low=r|0,this.high=t|0,this.unsigned=!!e}zt.prototype.__isLong__;Object.defineProperty(zt.prototype,"__isLong__",{value:!0});function $e(r){return(r&&r.__isLong__)===!0}zt.isLong=$e;var sg={},ag={};function vn(r,t){var e,o,n;return t?(r>>>=0,(n=0<=r&&r<256)&&(o=ag[r],o)?o:(e=Wt(r,(r|0)<0?-1:0,!0),n&&(ag[r]=e),e)):(r|=0,(n=-128<=r&&r<128)&&(o=sg[r],o)?o:(e=Wt(r,r<0?-1:0,!1),n&&(sg[r]=e),e))}zt.fromInt=vn;function qe(r,t){if(isNaN(r))return t?In:Xe;if(t){if(r<0)return In;if(r>=lg)return fg}else{if(r<=-cg)return Ee;if(r+1>=cg)return mg}return r<0?qe(-r,t).neg():Wt(r%Ua|0,r/Ua|0,t)}zt.fromNumber=qe;function Wt(r,t,e){return new zt(r,t,e)}zt.fromBits=Wt;var Jc=Math.pow;function cf(r,t,e){if(r.length===0)throw Error("empty string");if(r==="NaN"||r==="Infinity"||r==="+Infinity"||r==="-Infinity")return Xe;if(typeof t=="number"?(e=t,t=!1):t=!!t,e=e||10,e<2||36<e)throw RangeError("radix");var o;if((o=r.indexOf("-"))>0)throw Error("interior hyphen");if(o===0)return cf(r.substring(1),t,e).neg();for(var n=qe(Jc(e,8)),s=Xe,a=0;a<r.length;a+=8){var i=Math.min(8,r.length-a),c=parseInt(r.substring(a,a+i),e);if(i<8){var p=qe(Jc(e,i));s=s.mul(p).add(qe(c))}else s=s.mul(n),s=s.add(qe(c))}return s.unsigned=t,s}zt.fromString=cf;function ir(r,t){return typeof r=="number"?qe(r,t):typeof r=="string"?cf(r,t):Wt(r.low,r.high,typeof t=="boolean"?t:r.unsigned)}zt.fromValue=ir;var ig=65536,wE=1<<24,Ua=ig*ig,lg=Ua*Ua,cg=lg/2,pg=vn(wE),Xe=vn(0);zt.ZERO=Xe;var In=vn(0,!0);zt.UZERO=In;var Ga=vn(1);zt.ONE=Ga;var ug=vn(1,!0);zt.UONE=ug;var af=vn(-1);zt.NEG_ONE=af;var mg=Wt(-1,2147483647,!1);zt.MAX_VALUE=mg;var fg=Wt(-1,-1,!0);zt.MAX_UNSIGNED_VALUE=fg;var Ee=Wt(0,-2147483648,!1);zt.MIN_VALUE=Ee;var Q=zt.prototype;Q.toInt=function(){return this.unsigned?this.low>>>0:this.low};Q.toNumber=function(){return this.unsigned?(this.high>>>0)*Ua+(this.low>>>0):this.high*Ua+(this.low>>>0)};Q.toString=function(t){if(t=t||10,t<2||36<t)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(Ee)){var e=qe(t),o=this.div(e),n=o.mul(e).sub(this);return o.toString(t)+n.toInt().toString(t)}else return"-"+this.neg().toString(t);for(var s=qe(Jc(t,6),this.unsigned),a=this,i="";;){var c=a.div(s),p=a.sub(c.mul(s)).toInt()>>>0,l=p.toString(t);if(a=c,a.isZero())return l+i;for(;l.length<6;)l="0"+l;i=""+l+i}};Q.getHighBits=function(){return this.high};Q.getHighBitsUnsigned=function(){return this.high>>>0};Q.getLowBits=function(){return this.low};Q.getLowBitsUnsigned=function(){return this.low>>>0};Q.getNumBitsAbs=function(){if(this.isNegative())return this.eq(Ee)?64:this.neg().getNumBitsAbs();for(var t=this.high!=0?this.high:this.low,e=31;e>0&&(t&1<<e)==0;e--);return this.high!=0?e+33:e+1};Q.isZero=function(){return this.high===0&&this.low===0};Q.eqz=Q.isZero;Q.isNegative=function(){return!this.unsigned&&this.high<0};Q.isPositive=function(){return this.unsigned||this.high>=0};Q.isOdd=function(){return(this.low&1)===1};Q.isEven=function(){return(this.low&1)===0};Q.equals=function(t){return $e(t)||(t=ir(t)),this.unsigned!==t.unsigned&&this.high>>>31===1&&t.high>>>31===1?!1:this.high===t.high&&this.low===t.low};Q.eq=Q.equals;Q.notEquals=function(t){return!this.eq(t)};Q.neq=Q.notEquals;Q.ne=Q.notEquals;Q.lessThan=function(t){return this.comp(t)<0};Q.lt=Q.lessThan;Q.lessThanOrEqual=function(t){return this.comp(t)<=0};Q.lte=Q.lessThanOrEqual;Q.le=Q.lessThanOrEqual;Q.greaterThan=function(t){return this.comp(t)>0};Q.gt=Q.greaterThan;Q.greaterThanOrEqual=function(t){return this.comp(t)>=0};Q.gte=Q.greaterThanOrEqual;Q.ge=Q.greaterThanOrEqual;Q.compare=function(t){if($e(t)||(t=ir(t)),this.eq(t))return 0;var e=this.isNegative(),o=t.isNegative();return e&&!o?-1:!e&&o?1:this.unsigned?t.high>>>0>this.high>>>0||t.high===this.high&&t.low>>>0>this.low>>>0?-1:1:this.sub(t).isNegative()?-1:1};Q.comp=Q.compare;Q.negate=function(){return!this.unsigned&&this.eq(Ee)?Ee:this.not().add(Ga)};Q.neg=Q.negate;Q.add=function(t){$e(t)||(t=ir(t));var e=this.high>>>16,o=this.high&65535,n=this.low>>>16,s=this.low&65535,a=t.high>>>16,i=t.high&65535,c=t.low>>>16,p=t.low&65535,l=0,u=0,m=0,f=0;return f+=s+p,m+=f>>>16,f&=65535,m+=n+c,u+=m>>>16,m&=65535,u+=o+i,l+=u>>>16,u&=65535,l+=e+a,l&=65535,Wt(m<<16|f,l<<16|u,this.unsigned)};Q.subtract=function(t){return $e(t)||(t=ir(t)),this.add(t.neg())};Q.sub=Q.subtract;Q.multiply=function(t){if(this.isZero())return Xe;if($e(t)||(t=ir(t)),Ke){var e=Ke.mul(this.low,this.high,t.low,t.high);return Wt(e,Ke.get_high(),this.unsigned)}if(t.isZero())return Xe;if(this.eq(Ee))return t.isOdd()?Ee:Xe;if(t.eq(Ee))return this.isOdd()?Ee:Xe;if(this.isNegative())return t.isNegative()?this.neg().mul(t.neg()):this.neg().mul(t).neg();if(t.isNegative())return this.mul(t.neg()).neg();if(this.lt(pg)&&t.lt(pg))return qe(this.toNumber()*t.toNumber(),this.unsigned);var o=this.high>>>16,n=this.high&65535,s=this.low>>>16,a=this.low&65535,i=t.high>>>16,c=t.high&65535,p=t.low>>>16,l=t.low&65535,u=0,m=0,f=0,d=0;return d+=a*l,f+=d>>>16,d&=65535,f+=s*l,m+=f>>>16,f&=65535,f+=a*p,m+=f>>>16,f&=65535,m+=n*l,u+=m>>>16,m&=65535,m+=s*p,u+=m>>>16,m&=65535,m+=a*c,u+=m>>>16,m&=65535,u+=o*l+n*p+s*c+a*i,u&=65535,Wt(f<<16|d,u<<16|m,this.unsigned)};Q.mul=Q.multiply;Q.divide=function(t){if($e(t)||(t=ir(t)),t.isZero())throw Error("division by zero");if(Ke){if(!this.unsigned&&this.high===-2147483648&&t.low===-1&&t.high===-1)return this;var e=(this.unsigned?Ke.div_u:Ke.div_s)(this.low,this.high,t.low,t.high);return Wt(e,Ke.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?In:Xe;var o,n,s;if(this.unsigned){if(t.unsigned||(t=t.toUnsigned()),t.gt(this))return In;if(t.gt(this.shru(1)))return ug;s=In}else{if(this.eq(Ee)){if(t.eq(Ga)||t.eq(af))return Ee;if(t.eq(Ee))return Ga;var a=this.shr(1);return o=a.div(t).shl(1),o.eq(Xe)?t.isNegative()?Ga:af:(n=this.sub(t.mul(o)),s=o.add(n.div(t)),s)}else if(t.eq(Ee))return this.unsigned?In:Xe;if(this.isNegative())return t.isNegative()?this.neg().div(t.neg()):this.neg().div(t).neg();if(t.isNegative())return this.div(t.neg()).neg();s=Xe}for(n=this;n.gte(t);){o=Math.max(1,Math.floor(n.toNumber()/t.toNumber()));for(var i=Math.ceil(Math.log(o)/Math.LN2),c=i<=48?1:Jc(2,i-48),p=qe(o),l=p.mul(t);l.isNegative()||l.gt(n);)o-=c,p=qe(o,this.unsigned),l=p.mul(t);p.isZero()&&(p=Ga),s=s.add(p),n=n.sub(l)}return s};Q.div=Q.divide;Q.modulo=function(t){if($e(t)||(t=ir(t)),Ke){var e=(this.unsigned?Ke.rem_u:Ke.rem_s)(this.low,this.high,t.low,t.high);return Wt(e,Ke.get_high(),this.unsigned)}return this.sub(this.div(t).mul(t))};Q.mod=Q.modulo;Q.rem=Q.modulo;Q.not=function(){return Wt(~this.low,~this.high,this.unsigned)};Q.and=function(t){return $e(t)||(t=ir(t)),Wt(this.low&t.low,this.high&t.high,this.unsigned)};Q.or=function(t){return $e(t)||(t=ir(t)),Wt(this.low|t.low,this.high|t.high,this.unsigned)};Q.xor=function(t){return $e(t)||(t=ir(t)),Wt(this.low^t.low,this.high^t.high,this.unsigned)};Q.shiftLeft=function(t){return $e(t)&&(t=t.toInt()),(t&=63)===0?this:t<32?Wt(this.low<<t,this.high<<t|this.low>>>32-t,this.unsigned):Wt(0,this.low<<t-32,this.unsigned)};Q.shl=Q.shiftLeft;Q.shiftRight=function(t){return $e(t)&&(t=t.toInt()),(t&=63)===0?this:t<32?Wt(this.low>>>t|this.high<<32-t,this.high>>t,this.unsigned):Wt(this.high>>t-32,this.high>=0?0:-1,this.unsigned)};Q.shr=Q.shiftRight;Q.shiftRightUnsigned=function(t){if($e(t)&&(t=t.toInt()),t&=63,t===0)return this;var e=this.high;if(t<32){var o=this.low;return Wt(o>>>t|e<<32-t,e>>>t,this.unsigned)}else return t===32?Wt(e,0,this.unsigned):Wt(e>>>t-32,0,this.unsigned)};Q.shru=Q.shiftRightUnsigned;Q.shr_u=Q.shiftRightUnsigned;Q.toSigned=function(){return this.unsigned?Wt(this.low,this.high,!1):this};Q.toUnsigned=function(){return this.unsigned?this:Wt(this.low,this.high,!0)};Q.toBytes=function(t){return t?this.toBytesLE():this.toBytesBE()};Q.toBytesLE=function(){var t=this.high,e=this.low;return[e&255,e>>>8&255,e>>>16&255,e>>>24,t&255,t>>>8&255,t>>>16&255,t>>>24]};Q.toBytesBE=function(){var t=this.high,e=this.low;return[t>>>24,t>>>16&255,t>>>8&255,t&255,e>>>24,e>>>16&255,e>>>8&255,e&255]};zt.fromBytes=function(t,e,o){return o?zt.fromBytesLE(t,e):zt.fromBytesBE(t,e)};zt.fromBytesLE=function(t,e){return new zt(t[0]|t[1]<<8|t[2]<<16|t[3]<<24,t[4]|t[5]<<8|t[6]<<16|t[7]<<24,e)};zt.fromBytesBE=function(t,e){return new zt(t[4]<<24|t[5]<<16|t[6]<<8|t[7],t[0]<<24|t[1]<<16|t[2]<<8|t[3],e)}});var Yg=Ue(()=>{});var Zg=Ue(()=>{});var Uy=Ue((Gy,Hf)=>{(function(r,t,e){function o(i){var c=this,p=a();c.next=function(){var l=2091639*c.s0+c.c*23283064365386963e-26;return c.s0=c.s1,c.s1=c.s2,c.s2=l-(c.c=l|0)},c.c=1,c.s0=p(" "),c.s1=p(" "),c.s2=p(" "),c.s0-=p(i),c.s0<0&&(c.s0+=1),c.s1-=p(i),c.s1<0&&(c.s1+=1),c.s2-=p(i),c.s2<0&&(c.s2+=1),p=null}function n(i,c){return c.c=i.c,c.s0=i.s0,c.s1=i.s1,c.s2=i.s2,c}function s(i,c){var p=new o(i),l=c&&c.state,u=p.next;return u.int32=function(){return p.next()*4294967296|0},u.double=function(){return u()+(u()*2097152|0)*11102230246251565e-32},u.quick=u,l&&(typeof l=="object"&&n(l,p),u.state=function(){return n(p,{})}),u}function a(){var i=4022871197,c=function(p){p=String(p);for(var l=0;l<p.length;l++){i+=p.charCodeAt(l);var u=.02519603282416938*i;i=u>>>0,u-=i,u*=i,i=u>>>0,u-=i,i+=u*4294967296}return(i>>>0)*23283064365386963e-26};return c}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.alea=s})(Gy,typeof Hf=="object"&&Hf,typeof define=="function"&&define)});var Ky=Ue((Hy,Kf)=>{(function(r,t,e){function o(a){var i=this,c="";i.x=0,i.y=0,i.z=0,i.w=0,i.next=function(){var l=i.x^i.x<<11;return i.x=i.y,i.y=i.z,i.z=i.w,i.w^=i.w>>>19^l^l>>>8},a===(a|0)?i.x=a:c+=a;for(var p=0;p<c.length+64;p++)i.x^=c.charCodeAt(p)|0,i.next()}function n(a,i){return i.x=a.x,i.y=a.y,i.z=a.z,i.w=a.w,i}function s(a,i){var c=new o(a),p=i&&i.state,l=function(){return(c.next()>>>0)/4294967296};return l.double=function(){do var u=c.next()>>>11,m=(c.next()>>>0)/4294967296,f=(u+m)/(1<<21);while(f===0);return f},l.int32=c.next,l.quick=l,p&&(typeof p=="object"&&n(p,c),l.state=function(){return n(c,{})}),l}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xor128=s})(Hy,typeof Kf=="object"&&Kf,typeof define=="function"&&define)});var Xy=Ue((qy,qf)=>{(function(r,t,e){function o(a){var i=this,c="";i.next=function(){var l=i.x^i.x>>>2;return i.x=i.y,i.y=i.z,i.z=i.w,i.w=i.v,(i.d=i.d+362437|0)+(i.v=i.v^i.v<<4^(l^l<<1))|0},i.x=0,i.y=0,i.z=0,i.w=0,i.v=0,a===(a|0)?i.x=a:c+=a;for(var p=0;p<c.length+64;p++)i.x^=c.charCodeAt(p)|0,p==c.length&&(i.d=i.x<<10^i.x>>>4),i.next()}function n(a,i){return i.x=a.x,i.y=a.y,i.z=a.z,i.w=a.w,i.v=a.v,i.d=a.d,i}function s(a,i){var c=new o(a),p=i&&i.state,l=function(){return(c.next()>>>0)/4294967296};return l.double=function(){do var u=c.next()>>>11,m=(c.next()>>>0)/4294967296,f=(u+m)/(1<<21);while(f===0);return f},l.int32=c.next,l.quick=l,p&&(typeof p=="object"&&n(p,c),l.state=function(){return n(c,{})}),l}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xorwow=s})(qy,typeof qf=="object"&&qf,typeof define=="function"&&define)});var Yy=Ue((jy,Xf)=>{(function(r,t,e){function o(a){var i=this;i.next=function(){var p=i.x,l=i.i,u,m,f;return u=p[l],u^=u>>>7,m=u^u<<24,u=p[l+1&7],m^=u^u>>>10,u=p[l+3&7],m^=u^u>>>3,u=p[l+4&7],m^=u^u<<7,u=p[l+7&7],u=u^u<<13,m^=u^u<<9,p[l]=m,i.i=l+1&7,m};function c(p,l){var u,m,f=[];if(l===(l|0))m=f[0]=l;else for(l=""+l,u=0;u<l.length;++u)f[u&7]=f[u&7]<<15^l.charCodeAt(u)+f[u+1&7]<<13;for(;f.length<8;)f.push(0);for(u=0;u<8&&f[u]===0;++u);for(u==8?m=f[7]=-1:m=f[u],p.x=f,p.i=0,u=256;u>0;--u)p.next()}c(i,a)}function n(a,i){return i.x=a.x.slice(),i.i=a.i,i}function s(a,i){a==null&&(a=+new Date);var c=new o(a),p=i&&i.state,l=function(){return(c.next()>>>0)/4294967296};return l.double=function(){do var u=c.next()>>>11,m=(c.next()>>>0)/4294967296,f=(u+m)/(1<<21);while(f===0);return f},l.int32=c.next,l.quick=l,p&&(p.x&&n(p,c),l.state=function(){return n(c,{})}),l}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xorshift7=s})(jy,typeof Xf=="object"&&Xf,typeof define=="function"&&define)});var Qy=Ue((Zy,jf)=>{(function(r,t,e){function o(a){var i=this;i.next=function(){var p=i.w,l=i.X,u=i.i,m,f;return i.w=p=p+1640531527|0,f=l[u+34&127],m=l[u=u+1&127],f^=f<<13,m^=m<<17,f^=f>>>15,m^=m>>>12,f=l[u]=f^m,i.i=u,f+(p^p>>>16)|0};function c(p,l){var u,m,f,d,h,g=[],x=128;for(l===(l|0)?(m=l,l=null):(l=l+"\0",m=0,x=Math.max(x,l.length)),f=0,d=-32;d<x;++d)l&&(m^=l.charCodeAt((d+32)%l.length)),d===0&&(h=m),m^=m<<10,m^=m>>>15,m^=m<<4,m^=m>>>13,d>=0&&(h=h+1640531527|0,u=g[d&127]^=m+h,f=u==0?f+1:0);for(f>=128&&(g[(l&&l.length||0)&127]=-1),f=127,d=512;d>0;--d)m=g[f+34&127],u=g[f=f+1&127],m^=m<<13,u^=u<<17,m^=m>>>15,u^=u>>>12,g[f]=m^u;p.w=h,p.X=g,p.i=f}c(i,a)}function n(a,i){return i.i=a.i,i.w=a.w,i.X=a.X.slice(),i}function s(a,i){a==null&&(a=+new Date);var c=new o(a),p=i&&i.state,l=function(){return(c.next()>>>0)/4294967296};return l.double=function(){do var u=c.next()>>>11,m=(c.next()>>>0)/4294967296,f=(u+m)/(1<<21);while(f===0);return f},l.int32=c.next,l.quick=l,p&&(p.X&&n(p,c),l.state=function(){return n(c,{})}),l}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xor4096=s})(Zy,typeof jf=="object"&&jf,typeof define=="function"&&define)});var tb=Ue((Jy,Yf)=>{(function(r,t,e){function o(a){var i=this,c="";i.next=function(){var l=i.b,u=i.c,m=i.d,f=i.a;return l=l<<25^l>>>7^u,u=u-m|0,m=m<<24^m>>>8^f,f=f-l|0,i.b=l=l<<20^l>>>12^u,i.c=u=u-m|0,i.d=m<<16^u>>>16^f,i.a=f-l|0},i.a=0,i.b=0,i.c=-1640531527,i.d=1367130551,a===Math.floor(a)?(i.a=a/4294967296|0,i.b=a|0):c+=a;for(var p=0;p<c.length+20;p++)i.b^=c.charCodeAt(p)|0,i.next()}function n(a,i){return i.a=a.a,i.b=a.b,i.c=a.c,i.d=a.d,i}function s(a,i){var c=new o(a),p=i&&i.state,l=function(){return(c.next()>>>0)/4294967296};return l.double=function(){do var u=c.next()>>>11,m=(c.next()>>>0)/4294967296,f=(u+m)/(1<<21);while(f===0);return f},l.int32=c.next,l.quick=l,p&&(typeof p=="object"&&n(p,c),l.state=function(){return n(c,{})}),l}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.tychei=s})(Jy,typeof Yf=="object"&&Yf,typeof define=="function"&&define)});var eb=Ue(()=>{});var ob=Ue((rb,Yp)=>{(function(r,t,e){var o=256,n=6,s=52,a="random",i=e.pow(o,n),c=e.pow(2,s),p=c*2,l=o-1,u;function m(S,N,k){var $=[];N=N==!0?{entropy:!0}:N||{};var R=g(h(N.entropy?[S,b(t)]:S??x(),3),$),A=new f($),D=function(){for(var _=A.g(n),O=i,L=0;_<c;)_=(_+L)*o,O*=o,L=A.g(1);for(;_>=p;)_/=2,O/=2,L>>>=1;return(_+L)/O};return D.int32=function(){return A.g(4)|0},D.quick=function(){return A.g(4)/4294967296},D.double=D,g(b(A.S),t),(N.pass||k||function(_,O,L,B){return B&&(B.S&&d(B,A),_.state=function(){return d(A,{})}),L?(e[a]=_,O):_})(D,R,"global"in N?N.global:this==e,N.state)}function f(S){var N,k=S.length,$=this,R=0,A=$.i=$.j=0,D=$.S=[];for(k||(S=[k++]);R<o;)D[R]=R++;for(R=0;R<o;R++)D[R]=D[A=l&A+S[R%k]+(N=D[R])],D[A]=N;($.g=function(_){for(var O,L=0,B=$.i,M=$.j,V=$.S;_--;)O=V[B=l&B+1],L=L*o+V[l&(V[B]=V[M=l&M+O])+(V[M]=O)];return $.i=B,$.j=M,L})(o)}function d(S,N){return N.i=S.i,N.j=S.j,N.S=S.S.slice(),N}function h(S,N){var k=[],$=typeof S,R;if(N&&$=="object")for(R in S)try{k.push(h(S[R],N-1))}catch{}return k.length?k:$=="string"?S:S+"\0"}function g(S,N){for(var k=S+"",$,R=0;R<k.length;)N[l&R]=l&($^=N[l&R]*19)+k.charCodeAt(R++);return b(N)}function x(){try{var S;return u&&(S=u.randomBytes)?S=S(o):(S=new Uint8Array(o),(r.crypto||r.msCrypto).getRandomValues(S)),b(S)}catch{var N=r.navigator,k=N&&N.plugins;return[+new Date,r,k,r.screen,b(t)]}}function b(S){return String.fromCharCode.apply(0,S)}if(g(e.random(),t),typeof Yp=="object"&&Yp.exports){Yp.exports=m;try{u=eb()}catch{}}else typeof define=="function"&&define.amd?define(function(){return m}):e["seed"+a]=m})(typeof self<"u"?self:rb,[],Math)});var Zf=Ue((UJ,nb)=>{var xA=Uy(),yA=Ky(),bA=Xy(),CA=Yy(),TA=Qy(),SA=tb(),zn=ob();zn.alea=xA;zn.xor128=yA;zn.xorwow=bA;zn.xorshift7=CA;zn.xor4096=TA;zn.tychei=SA;nb.exports=zn});var Eo=class{constructor(t,e){this.backend=t,this.dataMover=e,this.data=new WeakMap,this.dataIdsCount=0}get(t){return this.data.has(t)||this.dataMover.moveData(this.backend,t),this.data.get(t)}set(t,e){this.dataIdsCount++,this.data.set(t,e)}has(t){return this.data.has(t)}delete(t){return this.dataIdsCount--,this.data.delete(t)}numDataIds(){return this.dataIdsCount}},Or=class{refCount(t){return Pe("refCount")}incRef(t){return Pe("incRef")}timerAvailable(){return!0}time(t){return Pe("time")}read(t){return Pe("read")}readSync(t){return Pe("readSync")}readToGPU(t,e){return Pe("readToGPU")}numDataIds(){return Pe("numDataIds")}disposeData(t,e){return Pe("disposeData")}write(t,e,o){return Pe("write")}move(t,e,o,n,s){return Pe("move")}memory(){return Pe("memory")}floatPrecision(){return Pe("floatPrecision")}epsilon(){return this.floatPrecision()===32?1e-7:1e-4}dispose(){return Pe("dispose")}};function Pe(r){throw new Error(`'${r}' not yet implemented or not found in the registry. This kernel may not be supported by the tfjs backend you have chosen`)}function Yh(r){let t=r.length,e=0;for(;t>0;)e=Math.random()*t|0,t--,Bc(r,t,e)}function eE(r,t){if(r.length!==t.length)throw new Error(`Array sizes must match to be shuffled together First array length was ${r.length}Second array length was ${t.length}`);let e=r.length,o=0;for(;e>0;)o=Math.random()*e|0,e--,Bc(r,e,o),Bc(t,e,o)}function cs(r,t,e){return Math.max(r,Math.min(t,e))}function rE(r){return r%2===0?r:r+1}function Bc(r,t,e){let o=r[t];r[t]=r[e],r[e]=o}function oE(r){let t=0;for(let e=0;e<r.length;e++)t+=r[e];return t}function nE(r,t){let e=Math.random();return t*e+(1-e)*r}function sE(r,t){let e=0;for(let o=0;o<r.length;o++){let n=Number(r[o])-Number(t[o]);e+=n*n}return e}function E(r,t){if(!r)throw new Error(typeof t=="string"?t:t())}function qt(r,t,e=""){E(He(r,t),()=>e+` Shapes ${r} and ${t} must match`)}function Le(r){E(r!=null,()=>"The input to the tensor constructor must be a non-null value.")}function to(r,t=[],e=!1){if(t==null&&(t=[]),Array.isArray(r)||ke(r)&&!e)for(let o=0;o<r.length;++o)to(r[o],t,e);else t.push(r);return t}function xt(r){if(r.length===0)return 1;let t=r[0];for(let e=1;e<r.length;e++)t*=r[e];return t}function aE(r){return r.length===0}function He(r,t){if(r===t)return!0;if(r==null||t==null||r.length!==t.length)return!1;for(let e=0;e<r.length;e++)if(r[e]!==t[e])return!1;return!0}function Pr(r){return r%1===0}function iE(r){if(Math.tanh!=null)return Math.tanh(r);if(r===1/0)return 1;if(r===-1/0)return-1;{let t=Math.exp(2*r);return(t-1)/(t+1)}}function cE(r){let t=Math.ceil(Math.sqrt(r));return[t,Math.ceil(r/t)]}function pE(r){let t=new Uint32Array(r);for(let e=0;e<r;++e)t[e]=e;return Yh(t),t}function Ro(r,t){return t<=r.length?r:r+" ".repeat(t-r.length)}function lE(r,t=n=>0,e,o=setTimeout){return new Promise((n,s)=>{let a=0,i=()=>{if(r()){n();return}a++;let c=t(a);if(e!=null&&a>=e){s();return}o(i,c)};i()})}function uE(r,t){let e=1,o=-1;for(let s=0;s<r.length;++s)if(r[s]>=0)e*=r[s];else if(r[s]===-1){if(o!==-1)throw Error(`Shapes can only have 1 implicit size. Found -1 at dim ${o} and dim ${s}`);o=s}else if(r[s]<0)throw Error(`Shapes can not be < 0. Found ${r[s]} at dim ${s}`);if(o===-1){if(t>0&&t!==e)throw Error(`Size(${t}) must match the product of shape ${r}`);return r}if(e===0)throw Error(`Cannot infer the missing size in [${r}] when there are 0 elements`);if(t%e!==0)throw Error(`The implicit shape can't be a fractional number. Got ${t} / ${e}`);let n=r.slice();return n[o]=t/e,n}function eo(r,t){let e=t.length;return r=r==null?t.map((o,n)=>n):[].concat(r),E(r.every(o=>o>=-e&&o<e),()=>`All values in axis param must be in range [-${e}, ${e}) but got axis ${r}`),E(r.every(o=>Pr(o)),()=>`All values in axis param must be integers but got axis ${r}`),r.map(o=>o<0?e+o:o)}function Km(r,t){let e=[],o=[],n=t!=null&&Array.isArray(t)&&t.length===0,s=t==null||n?null:eo(t,r).sort(),a=0;for(let i=0;i<r.length;++i){if(s!=null){if(s[a]===i&&r[i]!==1)throw new Error(`Can't squeeze axis ${i} since its dim '${r[i]}' is not 1`);(s[a]==null||s[a]>i)&&r[i]===1&&(e.push(r[i]),o.push(i)),s[a]<=i&&a++}r[i]!==1&&(e.push(r[i]),o.push(i))}return{newShape:e,keptDims:o}}function qm(r,t){let e=null;if(r==null||r==="float32")e=new Float32Array(t);else if(r==="int32")e=new Int32Array(t);else if(r==="bool")e=new Uint8Array(t);else throw new Error(`Unknown data type ${r}`);return e}function Xm(r,t){let e=null;if(r==null||r==="float32")e=new Float32Array(t);else if(r==="int32")e=new Int32Array(t);else if(r==="bool")e=new Uint8Array(t);else if(r==="string")e=new Array(t);else throw new Error(`Unknown data type ${r}`);return e}function jm(r,t){for(let e=0;e<r.length;e++){let o=r[e];if(isNaN(o)||!isFinite(o))throw Error(`A tensor of type ${t} being uploaded contains ${o}.`)}}function Ym(r){return r==="bool"||r==="complex64"||r==="float32"||r==="int32"||r==="string"}function mE(r,t){return!(t==="complex64"||t==="float32"&&r!=="complex64"||t==="int32"&&r!=="float32"&&r!=="complex64"||t==="bool"&&r==="bool")}function ke(r){return r instanceof Float32Array||r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray}function Vc(r){if(r==="float32"||r==="int32")return 4;if(r==="complex64")return 8;if(r==="bool")return 1;throw new Error(`Unknown dtype ${r}`)}function Zm(r){if(r==null)return 0;let t=0;return r.forEach(e=>t+=e.length),t}function ps(r){return typeof r=="string"||r instanceof String}function Zh(r){return typeof r=="boolean"}function Qh(r){return typeof r=="number"}function ls(r){return Array.isArray(r)?ls(r[0]):r instanceof Float32Array?"float32":r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray?"int32":Qh(r)?"float32":ps(r)?"string":Zh(r)?"bool":"float32"}function Mc(r){return!!(r&&r.constructor&&r.call&&r.apply)}function us(r,t){for(let e=t;e<r;++e)if(r%e===0)return e;return r}function xr(r){let t=r.length;if(t<2)return[];let e=new Array(t-1);e[t-2]=r[t-1];for(let o=t-3;o>=0;--o)e[o]=e[o+1]*r[o+1];return e}function Jh(r,t,e,o=!1){let n=new Array;if(t.length===1){let s=t[0]*(o?2:1);for(let a=0;a<s;a++)n[a]=e[r+a]}else{let s=t[0],a=t.slice(1),i=a.reduce((c,p)=>c*p)*(o?2:1);for(let c=0;c<s;c++)n[c]=Jh(r+c*i,a,e,o)}return n}function $o(r,t,e=!1){if(r.length===0)return t[0];let o=r.reduce((n,s)=>n*s)*(e?2:1);if(o===0)return[];if(o!==t.length)throw new Error(`[${r}] does not match the input size ${t.length}${e?" for a complex tensor":""}.`);return Jh(0,r,t,e)}function Pi(r,t){let e=ms(r,t);for(let o=0;o<e.length;o++)e[o]=1;return e}function ms(r,t){if(t==null||t==="float32"||t==="complex64")return new Float32Array(r);if(t==="int32")return new Int32Array(r);if(t==="bool")return new Uint8Array(r);throw new Error(`Unknown data type ${t}`)}function fE(r,t){let e=r.reduce((o,n)=>o*n,1);if(t==null||t==="float32")return $o(r,new Float32Array(e));if(t==="int32")return $o(r,new Int32Array(e));if(t==="bool")return $o(r,new Uint8Array(e));throw new Error(`Unknown data type ${t}`)}function Li(r){r.forEach(t=>{E(Number.isInteger(t)&&t>=0,()=>`Tensor must have a shape comprised of positive integers but got shape [${r}].`)})}function dE(r,t,e){if(t===0)return 0;if(t===1)return r[0];let o=r[r.length-1];for(let n=0;n<r.length-1;++n)o+=e[n]*r[n];return o}function hE(r,t,e){if(t===0)return[];if(t===1)return[r];let o=new Array(t);for(let n=0;n<o.length-1;++n)o[n]=Math.floor(r/e[n]),r-=o[n]*e[n];return o[o.length-1]=r,o}function Bi(r){return r&&r.then&&typeof r.then=="function"}var tg="tfjsflags",Vi=class{constructor(t){this.global=t,this.flags={},this.flagRegistry={},this.urlFlags={},this.getQueryParams=xE,this.populateURLFlags()}setPlatform(t,e){this.platform!=null&&(F().getBool("IS_TEST")||F().getBool("PROD")||console.warn(`Platform ${this.platformName} has already been set. Overwriting the platform with ${t}.`)),this.platformName=t,this.platform=e}registerFlag(t,e,o){if(this.flagRegistry[t]={evaluationFn:e,setHook:o},this.urlFlags[t]!=null){let n=this.urlFlags[t];F().getBool("IS_TEST")||F().getBool("PROD")||console.warn(`Setting feature override from URL ${t}: ${n}.`),this.set(t,n)}}async getAsync(t){return t in this.flags?this.flags[t]:(this.flags[t]=await this.evaluateFlag(t),this.flags[t])}get(t){if(t in this.flags)return this.flags[t];let e=this.evaluateFlag(t);if(Bi(e))throw new Error(`Flag ${t} cannot be synchronously evaluated. Please use getAsync() instead.`);return this.flags[t]=e,this.flags[t]}getNumber(t){return this.get(t)}getBool(t){return this.get(t)}getFlags(){return this.flags}get features(){return this.flags}set(t,e){if(this.flagRegistry[t]==null)throw new Error(`Cannot set flag ${t} as it has not been registered.`);this.flags[t]=e,this.flagRegistry[t].setHook!=null&&this.flagRegistry[t].setHook(e)}evaluateFlag(t){if(this.flagRegistry[t]==null)throw new Error(`Cannot evaluate flag '${t}': no evaluation function found.`);return this.flagRegistry[t].evaluationFn()}setFlags(t){this.flags=Object.assign({},t)}reset(){this.flags={},this.urlFlags={},this.populateURLFlags()}populateURLFlags(){if(typeof this.global>"u"||typeof this.global.location>"u"||typeof this.global.location.search>"u")return;let t=this.getQueryParams(this.global.location.search);tg in t&&t[tg].split(",").forEach(o=>{let[n,s]=o.split(":");this.urlFlags[n]=bE(n,s)})}};function xE(r){let t={};return r.replace(/[?&]([^=?&]+)(?:=([^&]*))?/g,(e,...o)=>(yE(t,o[0],o[1]),o.join("="))),t}function yE(r,t,e){r[decodeURIComponent(t)]=decodeURIComponent(e||"")}function bE(r,t){if(t=t.toLowerCase(),t==="true"||t==="false")return t==="true";if(`${+t}`===t)return+t;throw new Error(`Could not parse value flag value ${t} for flag ${r}.`)}function F(){return Qm}var Qm=null;function eg(r){Qm=r}var Jm;function tf(){if(Jm==null){let r;if(typeof window<"u")r=window;else if(typeof global<"u")r=global;else if(typeof process<"u")r=process;else if(typeof self<"u")r=self;else throw new Error("Could not find a global object");Jm=r}return Jm}function CE(){let r=tf();return r._tfGlobals==null&&(r._tfGlobals=new Map),r._tfGlobals}function Mi(r,t){let e=CE();if(e.has(r))return e.get(r);{let o=t();return e.set(r,o),e.get(r)}}var Ao="Acos",Fo="Acosh";var fs="AddN";var ds="ArgMax",hs="ArgMin",Do="Asin",_o="Asinh",Oo="Atan",Po="Atanh",Lo="Atan2",gs="AvgPool",zc="AvgPoolGrad",xs="AvgPool3D",Wc="AvgPool3DGrad",ys="BatchMatMul",bs="BatchToSpaceND",Cs="Bincount";var Ts="BroadcastArgs",ro="Cast",Bo="Ceil",Vo="ClipByValue",Ss="Complex",ws="ComplexAbs",Ns="Concat",Is="Conv2D",vs="Conv2DBackpropFilter",ks="Conv2DBackpropInput",Es="Conv3D",Gc="Conv3DBackpropFilterV2",$s="Conv3DBackpropInputV2";var Mo="Cosh",Rs="Cumprod",As="Cumsum",Fs="CropAndResize",Ds="DenseBincount",_s="DepthToSpace",Os="DepthwiseConv2dNative",Ps="DepthwiseConv2dNativeBackpropFilter",Ls="DepthwiseConv2dNativeBackpropInput",Bs="Diag",Vs="Dilation2D",ef="Dilation2DBackpropInput",rf="Dilation2DBackpropFilter",zo="RealDiv",Ms="Einsum";var Uc="EluGrad";var Wo="Equal";var zs="ExpandDims",Go="Expm1";var Ws="Fill",Gs="FlipLeftRight",Uo="Floor",Ho="FloorDiv",Us="FusedBatchNorm",Hs="GatherV2",Ks="GatherNd",Ko="Greater",qo="GreaterEqual",oo="Identity",qs="IFFT",Xs="Imag",Xo="IsFinite",jo="IsInf",Yo="IsNan",js="LeakyRelu",Zo="Less",Qo="LessEqual",Ys="LinSpace";var Jo="Log1p",tn="LogicalAnd",en="LogicalNot",rn="LogicalOr";var Hc="LRNGrad";var on="Maximum",Zs="MaxPool",Kc="MaxPoolGrad",Qs="MaxPool3D",qc="MaxPool3DGrad",Js="MaxPoolWithArgmax",ta="Mean";var nn="Minimum",ea="MirrorPad";var ra="Multinomial",sn="Multiply";var an="NotEqual",oa="NonMaxSuppressionV3",na="NonMaxSuppressionV4",sa="NonMaxSuppressionV5",aa="OnesLike",ia="OneHot",ca="Pack",pa="PadV2";var la="Prelu",ua="Prod",ma="RaggedGather",fa="RaggedTensorToTensor",da="Range",ha="Real",cn="Reciprocal",pn="Relu",ga="Reshape",xa="ResizeNearestNeighbor",Xc="ResizeNearestNeighborGrad",ya="ResizeBilinear",jc="ResizeBilinearGrad",ln="Relu6",ba="Reverse",un="Round",mn="Rsqrt",Ca="ScatterNd",Ta="SearchSorted",Sa="Select",fn="Selu",wa="Slice";var dn="Sinh",hn="Sign",gn="Sigmoid",xn="Softplus",yn="Sqrt";var Na="SpaceToBatchND",Ia="SplitV",va="Softmax",ka="SparseFillEmptyRows",Ea="SparseReshape",$a="SparseSegmentMean",Ra="SparseSegmentSum",Aa="SparseToDense",bn="SquaredDifference",Yc="Square",Fa="StridedSlice",Da="StringNGrams",_a="StringSplit",Oa="StringToHashBucketFast";var Cn="Tanh",no="Tile",Pa="TopK",La="Transform",so="Transpose",Ba="Unique",Va="Unpack",Ma="UnsortedSegmentSum";var za="ZerosLike",Tn="Step",rg="FromPixels",Wa="RotateWithOffset",Sn="_FusedMatMul",wn="FusedConv2D",Nn="FusedDepthwiseConv2D";function Lr(...r){F().getBool("IS_TEST")||F().getBool("PROD")||console.warn(...r)}function TE(...r){F().getBool("IS_TEST")||F().getBool("PROD")||console.log(...r)}var Zc=Mi("kernelRegistry",()=>new Map),SE=Mi("gradRegistry",()=>new Map);function of(r,t){let e=ng(r,t);return Zc.get(e)}function nf(r){return SE.get(r)}function sf(r){let t=Zc.entries(),e=[];for(;;){let{done:o,value:n}=t.next();if(o)break;let[s,a]=n,[i]=s.split("_");i===r&&e.push(a)}return e}function Qc(r){let{kernelName:t,backendName:e}=r,o=ng(t,e);Zc.has(o)&&Lr(`The kernel '${t}' for backend '${e}' is already registered`),Zc.set(o,r)}function ng(r,t){return`${t}_${r}`}var y={};At(y,{arraysEqual:()=>He,assert:()=>E,assertNonNegativeIntegerDimensions:()=>Li,assertNonNull:()=>Le,assertShapesMatch:()=>qt,bytesFromStringArray:()=>Zm,bytesPerElement:()=>Vc,checkConversionForErrors:()=>jm,clamp:()=>cs,computeStrides:()=>xr,createScalarValue:()=>$E,createShuffledIndices:()=>pE,decodeString:()=>qa,distSquared:()=>sE,encodeString:()=>Ka,fetch:()=>AE,fingerPrint64:()=>EE,flatten:()=>to,getArrayFromDType:()=>Xm,getTypedArrayFromDType:()=>qm,hasEncodingLoss:()=>mE,hexToLong:()=>zi,indexToLoc:()=>hE,inferDtype:()=>ls,inferFromImplicitShape:()=>uE,isBoolean:()=>Zh,isFunction:()=>Mc,isInt:()=>Pr,isNumber:()=>Qh,isPromise:()=>Bi,isScalarShape:()=>aE,isString:()=>ps,isTypedArray:()=>ke,isValidDtype:()=>Ym,locToIndex:()=>dE,makeOnesTypedArray:()=>Pi,makeZerosNestedTypedArray:()=>fE,makeZerosTypedArray:()=>ms,nearestDivisor:()=>us,nearestLargerEven:()=>rE,now:()=>$n,parseAxisParam:()=>eo,randUniform:()=>nE,repeatedTry:()=>lE,rightPad:()=>Ro,shuffle:()=>Yh,shuffleCombo:()=>eE,sizeFromShape:()=>xt,sizeToSquarishShape:()=>cE,squeezeShape:()=>Km,sum:()=>oE,swap:()=>Bc,tanh:()=>iE,toNestedArray:()=>$o,toTypedArray:()=>Ha});var lf=Hm(hg());var En=lf.default||lf;function zi(r){return En.fromString(r,!0,16)}var xg=zi("c3a5c85c97cb3127"),kn=zi("b492b66fbe98f273"),xe=zi("9ae16a3b2f90404f");function pf(r){return r.xor(r.shru(47))}function yg(r,t,e){let o=r.slice(t,t+e);return En.fromBytes(Array.from(o),!0,!0)}function Pt(r,t){return yg(r,t,8)}function gg(r,t){return yg(r,t,4)}function se(r,t){return t===0?r:r.shru(t).or(r.shl(64-t))}function ao(r,t,e=zi("9ddfea08eb382d69")){let o=r.xor(t).mul(e);o=o.xor(o.shru(47));let n=t.xor(o).mul(e);return n=n.xor(n.shru(47)),n=n.mul(e),n}function NE(r,t,e,o,n,s){n=n.add(r),s=se(s.add(n).add(o),21);let a=n;return n=n.add(t),n=n.add(e),s=s.add(se(n,44)),[n.add(o),s.add(a)]}function tp(r,t,e,o){return NE(Pt(r,t),Pt(r,t+8),Pt(r,t+16),Pt(r,t+24),e,o)}function IE(r,t=r.length){if(t>=8){let e=xe.add(t*2),o=Pt(r,0).add(xe),n=Pt(r,t-8),s=se(n,37).mul(e).add(o),a=se(o,25).add(n).mul(e);return ao(s,a,e)}if(t>=4){let e=xe.add(t*2),o=gg(r,0);return ao(o.shl(3).add(t),gg(r,t-4),e)}if(t>0){let e=r[0],o=r[t>>1],n=r[t-1],s=e+(o<<8),a=t+(n<<2);return pf(xe.mul(s).xor(xg.mul(a))).mul(xe)}return xe}function vE(r,t=r.length){let e=xe.add(t*2),o=Pt(r,0).mul(kn),n=Pt(r,8),s=Pt(r,t-8).mul(e),a=Pt(r,t-16).mul(xe);return ao(se(o.add(n),43).add(se(s,30)).add(a),o.add(se(n.add(xe),18)).add(s),e)}function kE(r,t=r.length){let e=xe.add(t*2),o=Pt(r,0).mul(xe),n=Pt(r,8),s=Pt(r,t-8).mul(e),a=Pt(r,t-16).mul(xe),i=se(o.add(n),43).add(se(s,30)).add(a),c=ao(i,o.add(se(n.add(xe),18)).add(s),e),p=Pt(r,16).mul(e),l=Pt(r,24),u=i.add(Pt(r,t-32)).mul(e),m=c.add(Pt(r,t-24)).mul(e);return ao(se(p.add(l),43).add(se(u,30)).add(m),p.add(se(l.add(o),18)).add(u),e)}function EE(r,t=r.length){let e=En.fromNumber(81,!0);if(t<=32)return t<=16?IE(r,t):vE(r,t);if(t<=64)return kE(r,t);let o=e,n=e.mul(kn).add(113),s=pf(n.mul(xe).add(113)).mul(xe),a=[En.UZERO,En.UZERO],i=[En.UZERO,En.UZERO];o=o.mul(xe).add(Pt(r,0));let c=0,p=(t-1>>6)*64,l=p+(t-1&63)-63;do o=se(o.add(n).add(a[0]).add(Pt(r,c+8)),37).mul(kn),n=se(n.add(a[1]).add(Pt(r,c+48)),42).mul(kn),o=o.xor(i[1]),n=n.add(a[0]).add(Pt(r,c+40)),s=se(s.add(i[0]),33).mul(kn),a=tp(r,c,a[1].mul(kn),o.add(i[0])),i=tp(r,c+32,s.add(i[1]),n.add(Pt(r,c+16))),[s,o]=[o,s],c+=64;while(c!==p);let u=kn.add(s.and(255).shl(1));return c=l,i[0]=i[0].add(t-1&63),a[0]=a[0].add(i[0]),i[0]=i[0].add(a[0]),o=se(o.add(n).add(a[0]).add(Pt(r,c+8)),37).mul(u),n=se(n.add(a[1]).add(Pt(r,c+48)),42).mul(u),o=o.xor(i[1].mul(9)),n=n.add(a[0].mul(9).add(Pt(r,c+40))),s=se(s.add(i[0]),33).mul(u),a=tp(r,c,a[1].mul(u),o.add(i[0])),i=tp(r,c+32,s.add(i[1]),n.add(Pt(r,c+16))),[s,o]=[o,s],ao(ao(a[0],i[0],u).add(pf(n).mul(xg)).add(s),ao(a[1],i[1],u).add(o),u)}function $E(r,t){return t==="string"?Ka(r):Ha([r],t)}function RE(r,t){return r instanceof Float32Array&&t==="float32"||r instanceof Int32Array&&t==="int32"||r instanceof Uint8Array&&t==="bool"}function Ha(r,t){if(t==="string")throw new Error("Cannot convert a string[] to a TypedArray");if(Array.isArray(r)&&(r=to(r)),F().getBool("DEBUG")&&jm(r,t),RE(r,t))return r;if(t==null||t==="float32"||t==="complex64")return new Float32Array(r);if(t==="int32")return new Int32Array(r);if(t==="bool"){let e=new Uint8Array(r.length);for(let o=0;o<e.length;++o)Math.round(r[o])!==0&&(e[o]=1);return e}else throw new Error(`Unknown data type ${t}`)}function $n(){return F().platform.now()}function AE(r,t){return F().platform.fetch(r,t)}function Ka(r,t="utf-8"){return t=t||"utf-8",F().platform.encode(r,t)}function qa(r,t="utf-8"){return t=t||"utf-8",F().platform.decode(r,t)}var ep=class{constructor(t,e){this.backendTimer=t,this.logger=e,e==null&&(this.logger=new uf)}profileKernel(t,e,o){let n,s=()=>{n=o()},a,i=$n();if(this.backendTimer.timerAvailable())a=this.backendTimer.time(s);else{s();for(let p of n)p.dataSync();a=Promise.resolve({kernelMs:$n()-i})}if(F().getBool("CHECK_COMPUTATION_FOR_ERRORS"))for(let p=0;p<n.length;p++){let l=n[p];l.data().then(u=>{FE(u,l.dtype,t)})}return{kernelName:t,outputs:n,inputs:e,timeMs:a.then(p=>p.kernelMs),extraInfo:a.then(p=>p.getExtraProfileInfo!=null?p.getExtraProfileInfo():"")}}logKernelProfile(t){let{kernelName:e,outputs:o,timeMs:n,inputs:s,extraInfo:a}=t;o.forEach(i=>{Promise.all([i.data(),n,a]).then(c=>{this.logger.logKernelProfile(e,i,c[0],c[1],s,c[2])})})}};function FE(r,t,e){if(t!=="float32")return!1;for(let o=0;o<r.length;o++){let n=r[o];if(isNaN(n)||!isFinite(n))return console.warn(`Found ${n} in the result of '${e}'`),!0}return!1}var uf=class{logKernelProfile(t,e,o,n,s,a){let i=typeof n=="number"?Ro(`${n}ms`,9):n.error,c=Ro(t,25),p=e.rank,l=e.size,u=Ro(e.shape.toString(),14),m="";for(let f in s){let d=s[f];if(d!=null){let h=d.shape||e.shape,g=h.length;m+=`${f}: ${g}D ${g>0?h:""} `}}console.log(`%c${c}	%c${i}	%c${p}D ${u}	%c${l}	%c${m}	%c${a}`,"font-weight:bold","color:red","color:blue","color: orange","color: green","color: steelblue")}};function bg(r,t,e){let o={},n={};for(let c=0;c<t.length;c++)o[t[c].id]=!0;for(let c=0;c<r.length;c++){let p=r[c],l=p.inputs;for(let u in l){let m=l[u],f=!1;for(let d=0;d<t.length;d++)if(o[m.id]){p.outputs.forEach(h=>o[h.id]=!0),f=!0,n[p.id]=!0;break}if(f)break}}let s={};s[e.id]=!0;let a={};for(let c=r.length-1;c>=0;c--){let p=r[c],l=p.inputs;for(let u=0;u<p.outputs.length;u++)if(s[p.outputs[u].id]){for(let m in l)s[l[m].id]=!0,a[p.id]=!0;break}}let i=[];for(let c=0;c<r.length;c++){let p=r[c];if(n[p.id]&&a[p.id]){let l={};for(let m in p.inputs){let f=p.inputs[m];o[f.id]&&(l[m]=f)}let u=Object.assign({},p);u.inputs=l,u.outputs=p.outputs,i.push(u)}}return i}function Cg(r,t,e,o){for(let n=t.length-1;n>=0;n--){let s=t[n],a=[];if(s.outputs.forEach(c=>{let p=r[c.id];p!=null?a.push(p):a.push(null)}),s.gradient==null)throw new Error(`Cannot compute gradient: gradient function not found for ${s.kernelName}.`);let i=s.gradient(a);for(let c in s.inputs){if(!(c in i))throw new Error(`Cannot backprop through input ${c}. Available gradients found: ${Object.keys(i)}.`);let p=e(()=>i[c]());if(p.dtype!=="float32")throw new Error(`Error in gradient for op ${s.kernelName}. The gradient of input ${c} must have 'float32' dtype, but has '${p.dtype}'`);let l=s.inputs[c];if(!He(p.shape,l.shape))throw new Error(`Error in gradient for op ${s.kernelName}. The gradient of input '${c}' has shape '${p.shape}', which does not match the shape of the input '${l.shape}'`);if(r[l.id]==null)r[l.id]=p;else{let u=r[l.id];r[l.id]=o(u,p),u.dispose()}}}}var Tg=20,Wi=3,mf=7;function Sg(r,t,e,o){let n=xr(t),s=DE(r,t,e,n),a=t.length,i=rp(r,t,e,n,s),c=["Tensor"];return o&&(c.push(`  dtype: ${e}`),c.push(`  rank: ${a}`),c.push(`  shape: [${t}]`),c.push("  values:")),c.push(i.map(p=>"    "+p).join(`
`)),c.join(`
`)}function DE(r,t,e,o){let n=xt(t),s=o[o.length-1],a=new Array(s).fill(0),i=t.length,c=e==="complex64"?Ui(r):r;if(i>1)for(let p=0;p<n/s;p++){let l=p*s;for(let u=0;u<s;u++)a[u]=Math.max(a[u],Gi(c[l+u],0,e).length)}return a}function Gi(r,t,e){let o;return Array.isArray(r)?o=`${parseFloat(r[0].toFixed(mf))} + ${parseFloat(r[1].toFixed(mf))}j`:ps(r)?o=`'${r}'`:e==="bool"?o=wg(r):o=parseFloat(r.toFixed(mf)).toString(),Ro(o,t)}function wg(r){return r===0?"false":"true"}function rp(r,t,e,o,n,s=!0){let a=e==="complex64"?2:1,i=t[0],c=t.length;if(c===0){if(e==="complex64"){let h=Ui(r);return[Gi(h[0],0,e)]}return e==="bool"?[wg(r[0])]:[r[0].toString()]}if(c===1){if(i>Tg){let g=Wi*a,x=Array.from(r.slice(0,g)),b=Array.from(r.slice((i-Wi)*a,i*a));return e==="complex64"&&(x=Ui(x),b=Ui(b)),["["+x.map((S,N)=>Gi(S,n[N],e)).join(", ")+", ..., "+b.map((S,N)=>Gi(S,n[i-Wi+N],e)).join(", ")+"]"]}return["["+(e==="complex64"?Ui(r):Array.from(r)).map((g,x)=>Gi(g,n[x],e)).join(", ")+"]"]}let p=t.slice(1),l=o.slice(1),u=o[0]*a,m=[];if(i>Tg){for(let h=0;h<Wi;h++){let g=h*u,x=g+u;m.push(...rp(r.slice(g,x),p,e,l,n,!1))}m.push("...");for(let h=i-Wi;h<i;h++){let g=h*u,x=g+u;m.push(...rp(r.slice(g,x),p,e,l,n,h===i-1))}}else for(let h=0;h<i;h++){let g=h*u,x=g+u;m.push(...rp(r.slice(g,x),p,e,l,n,h===i-1))}let f=c===2?",":"";m[0]="["+m[0]+f;for(let h=1;h<m.length-1;h++)m[h]=" "+m[h]+f;let d=`,
`;for(let h=2;h<c;h++)d+=`
`;return m[m.length-1]=" "+m[m.length-1]+"]"+(s?"":d),m}function Ui(r){let t=[];for(let e=0;e<r.length;e+=2)t.push([r[e],r[e+1]]);return t}var vt=class{constructor(t,e,o){if(this.dtype=e,this.shape=t.slice(),this.size=xt(t),o!=null){let n=o.length;E(n===this.size,()=>`Length of values '${n}' does not match the size inferred by the shape '${this.size}'.`)}if(e==="complex64")throw new Error("complex64 dtype TensorBuffers are not supported. Please create a TensorBuffer for the real and imaginary parts separately and call tf.complex(real, imag).");this.values=o||Xm(e,this.size),this.strides=xr(t)}set(t,...e){e.length===0&&(e=[0]),E(e.length===this.rank,()=>`The number of provided coordinates (${e.length}) must match the rank (${this.rank})`);let o=this.locToIndex(e);this.values[o]=t}get(...t){t.length===0&&(t=[0]);let e=0;for(let n of t){if(n<0||n>=this.shape[e]){let s=`Requested out of range element at ${t}.   Buffer shape=${this.shape}`;throw new Error(s)}e++}let o=t[t.length-1];for(let n=0;n<t.length-1;++n)o+=this.strides[n]*t[n];return this.values[o]}locToIndex(t){if(this.rank===0)return 0;if(this.rank===1)return t[0];let e=t[t.length-1];for(let o=0;o<t.length-1;++o)e+=this.strides[o]*t[o];return e}indexToLoc(t){if(this.rank===0)return[];if(this.rank===1)return[t];let e=new Array(this.shape.length);for(let o=0;o<e.length-1;++o)e[o]=Math.floor(t/this.strides[o]),t-=e[o]*this.strides[o];return e[e.length-1]=t,e}get rank(){return this.shape.length}toTensor(){return cr().makeTensor(this.values,this.shape,this.dtype)}},cr=null,Xa=null,_E=null;function Ng(r){cr=r}function Ig(r){Xa=r}function vg(r){_E=r}var Lt=class{constructor(t,e,o,n){this.kept=!1,this.isDisposedInternal=!1,this.shape=t.slice(),this.dtype=e||"float32",this.size=xt(t),this.strides=xr(t),this.dataId=o,this.id=n,this.rankType=this.rank<5?this.rank.toString():"higher"}get rank(){return this.shape.length}async buffer(){let t=await this.data();return Xa.buffer(this.shape,this.dtype,t)}bufferSync(){return Xa.buffer(this.shape,this.dtype,this.dataSync())}async array(){let t=await this.data();return $o(this.shape,t,this.dtype==="complex64")}arraySync(){return $o(this.shape,this.dataSync(),this.dtype==="complex64")}async data(){this.throwIfDisposed();let t=cr().read(this.dataId);if(this.dtype==="string"){let e=await t;try{return e.map(o=>qa(o))}catch{throw new Error("Failed to decode the string bytes into utf-8. To get the original bytes, call tensor.bytes().")}}return t}dataToGPU(t){return this.throwIfDisposed(),cr().readToGPU(this.dataId,t)}dataSync(){this.throwIfDisposed();let t=cr().readSync(this.dataId);if(this.dtype==="string")try{return t.map(e=>qa(e))}catch{throw new Error("Failed to decode the string bytes into utf-8. To get the original bytes, call tensor.bytes().")}return t}async bytes(){this.throwIfDisposed();let t=await cr().read(this.dataId);return this.dtype==="string"?t:new Uint8Array(t.buffer)}dispose(){this.isDisposed||(cr().disposeTensor(this),this.isDisposedInternal=!0)}get isDisposed(){return this.isDisposedInternal}throwIfDisposed(){if(this.isDisposed)throw new Error("Tensor is disposed.")}print(t=!1){return Xa.print(this,t)}clone(){return this.throwIfDisposed(),Xa.clone(this)}toString(t=!1){let e=this.dataSync();return Sg(e,this.shape,this.dtype,t)}cast(t){return this.throwIfDisposed(),Xa.cast(this,t)}variable(t=!0,e,o){return this.throwIfDisposed(),cr().makeVariable(this,t,e,o)}};Object.defineProperty(Lt,Symbol.hasInstance,{value:r=>!!r&&r.data!=null&&r.dataSync!=null&&r.throwIfDisposed!=null});function OE(){return Mi("Tensor",()=>Lt)}OE();var io=class extends Lt{constructor(t,e,o,n){super(t.shape,t.dtype,t.dataId,n),this.trainable=e,this.name=o}assign(t){if(t.dtype!==this.dtype)throw new Error(`dtype of the new value (${t.dtype}) and previous value (${this.dtype}) must match`);if(!He(t.shape,this.shape))throw new Error(`shape of the new value (${t.shape}) and previous value (${this.shape}) must match`);cr().disposeTensor(this),this.dataId=t.dataId,cr().incRef(this,null)}dispose(){cr().disposeVariable(this),this.isDisposedInternal=!0}};Object.defineProperty(io,Symbol.hasInstance,{value:r=>r instanceof Lt&&r.assign!=null&&r.assign instanceof Function});var ff;(function(r){r.R0="R0",r.R1="R1",r.R2="R2",r.R3="R3",r.R4="R4",r.R5="R5",r.R6="R6"})(ff||(ff={}));var df;(function(r){r.float32="float32",r.int32="int32",r.bool="int32",r.complex64="complex64"})(df||(df={}));var hf;(function(r){r.float32="float32",r.int32="int32",r.bool="bool",r.complex64="complex64"})(hf||(hf={}));var gf;(function(r){r.float32="float32",r.int32="float32",r.bool="float32",r.complex64="complex64"})(gf||(gf={}));var xf;(function(r){r.float32="complex64",r.int32="complex64",r.bool="complex64",r.complex64="complex64"})(xf||(xf={}));var PE={float32:gf,int32:df,bool:hf,complex64:xf};function Yt(r,t){if(r==="string"||t==="string"){if(r==="string"&&t==="string")return"string";throw new Error(`Can not upcast ${r} with ${t}`)}return PE[r][t]}function Rn(r){return Yt(r,"int32")}function ft(r,t){if(r.dtype===t.dtype)return[r,t];let e=Yt(r.dtype,t.dtype);return[r.cast(e),t.cast(e)]}function kg(r,t){E(r.dtype===t.dtype,()=>`The dtypes of the first(${r.dtype}) and second(${t.dtype}) input must match`)}function op(r){let t=[];return Eg(r,t,new Set),t}function Eg(r,t,e){if(r==null)return;if(r instanceof Lt){t.push(r);return}if(!LE(r))return;let o=r;for(let n in o){let s=o[n];e.has(s)||(e.add(s),Eg(s,t,e))}}function LE(r){return Array.isArray(r)||typeof r=="object"}function yf(r){return r.kernelName!=null}var np=class{constructor(){this.registeredVariables={},this.nextTapeNodeId=0,this.numBytes=0,this.numTensors=0,this.numStringTensors=0,this.numDataBuffers=0,this.gradientDepth=0,this.kernelDepth=0,this.scopeStack=[],this.numDataMovesStack=[],this.nextScopeId=0,this.tensorInfo=new WeakMap,this.profiling=!1,this.activeProfile={newBytes:0,newTensors:0,peakBytes:0,kernels:[],result:null,get kernelNames(){return Array.from(new Set(this.kernels.map(t=>t.name)))}}}dispose(){for(let t in this.registeredVariables)this.registeredVariables[t].dispose()}},Hi=class r{constructor(t){this.ENV=t,this.registry={},this.registryFactory={},this.pendingBackendInitId=0,this.state=new np}async ready(){if(this.pendingBackendInit!=null)return this.pendingBackendInit.then(()=>{});if(this.backendInstance!=null)return;let t=this.getSortedBackends();for(let e=0;e<t.length;e++){let o=t[e];if(await this.initializeBackend(o).success){await this.setBackend(o);return}}throw new Error("Could not initialize any backends, all backend initializations failed.")}get backend(){if(this.pendingBackendInit!=null)throw new Error(`Backend '${this.backendName}' has not yet been initialized. Make sure to await tf.ready() or await tf.setBackend() before calling other methods`);if(this.backendInstance==null){let{name:t,asyncInit:e}=this.initializeBackendsAndReturnBest();if(e)throw new Error(`The highest priority backend '${t}' has not yet been initialized. Make sure to await tf.ready() or await tf.setBackend() before calling other methods`);this.setBackend(t)}return this.backendInstance}backendNames(){return Object.keys(this.registryFactory)}findBackend(t){if(!(t in this.registry))if(t in this.registryFactory){let{asyncInit:e}=this.initializeBackend(t);if(e)return null}else return null;return this.registry[t]}findBackendFactory(t){return t in this.registryFactory?this.registryFactory[t].factory:null}registerBackend(t,e,o=1){return t in this.registryFactory?(Lr(`${t} backend was already registered. Reusing existing backend factory.`),!1):(this.registryFactory[t]={factory:e,priority:o},!0)}async setBackend(t){if(this.registryFactory[t]==null)throw new Error(`Backend name '${t}' not found in registry`);if(this.backendName=t,this.registry[t]==null){this.backendInstance=null;let{success:e,asyncInit:o}=this.initializeBackend(t);if(!(o?await e:e))return!1}return this.backendInstance=this.registry[t],this.setupRegisteredKernels(),this.profiler=new ep(this.backendInstance),!0}setupRegisteredKernels(){sf(this.backendName).forEach(e=>{e.setupFunc!=null&&e.setupFunc(this.backendInstance)})}disposeRegisteredKernels(t){sf(t).forEach(o=>{o.disposeFunc!=null&&o.disposeFunc(this.registry[t])})}initializeBackend(t){let e=this.registryFactory[t];if(e==null)throw new Error(`Cannot initialize backend ${t}, no registration found.`);try{let o=e.factory();if(o&&!(o instanceof Or)&&typeof o.then=="function"){let n=++this.pendingBackendInitId,s=o.then(a=>n<this.pendingBackendInitId?!1:(this.registry[t]=a,this.pendingBackendInit=null,!0)).catch(a=>(n<this.pendingBackendInitId||(this.pendingBackendInit=null,Lr(`Initialization of backend ${t} failed`),Lr(a.stack||a.message)),!1));return this.pendingBackendInit=s,{success:s,asyncInit:!0}}else return this.registry[t]=o,{success:!0,asyncInit:!1}}catch(o){return Lr(`Initialization of backend ${t} failed`),Lr(o.stack||o.message),{success:!1,asyncInit:!1}}}removeBackend(t){if(!(t in this.registryFactory))throw new Error(`${t} backend not found in registry`);this.backendName===t&&this.pendingBackendInit!=null&&this.pendingBackendInitId++,t in this.registry&&(this.disposeRegisteredKernels(t),this.registry[t].dispose(),delete this.registry[t]),delete this.registryFactory[t],this.backendName===t&&(this.pendingBackendInit=null,this.backendName=null,this.backendInstance=null)}getSortedBackends(){if(Object.keys(this.registryFactory).length===0)throw new Error("No backend found in registry.");return Object.keys(this.registryFactory).sort((t,e)=>this.registryFactory[e].priority-this.registryFactory[t].priority)}initializeBackendsAndReturnBest(){let t=this.getSortedBackends();for(let e=0;e<t.length;e++){let o=t[e],{success:n,asyncInit:s}=this.initializeBackend(o);if(s||n)return{name:o,asyncInit:s}}throw new Error("Could not initialize any backends, all backend initializations failed.")}moveData(t,e){let o=this.state.tensorInfo.get(e),n=o.backend,s=this.readSync(e),a=n.refCount(e);n.disposeData(e,!0),o.backend=t,t.move(e,s,o.shape,o.dtype,a),this.shouldCheckForMemLeaks()&&this.state.numDataMovesStack[this.state.numDataMovesStack.length-1]++}tidy(t,e){let o=null;if(e==null){if(typeof t!="function")throw new Error("Please provide a function to tidy()");e=t}else{if(typeof t!="string"&&!(t instanceof String))throw new Error("When calling with two arguments, the first argument to tidy() must be a string");if(typeof e!="function")throw new Error("When calling with two arguments, the 2nd argument to tidy() must be a function");o=t}let n;return this.scopedRun(()=>this.startScope(o),()=>this.endScope(n),()=>(n=e(),n instanceof Promise&&console.error("Cannot return a Promise inside of tidy."),n))}scopedRun(t,e,o){t();try{let n=o();return e(),n}catch(n){throw e(),n}}nextTensorId(){return r.nextTensorId++}nextVariableId(){return r.nextVariableId++}clone(t){let e=v.runKernel(oo,{x:t}),o={x:t},n=a=>({x:()=>{let i="float32",c={x:a},p={dtype:i};return v.runKernel(ro,c,p)}}),s=[];return this.addTapeNode(this.state.activeScope.name,o,[e],n,s,{}),e}runKernel(t,e,o){if(this.backendName==null&&this.backend,!(of(t,this.backendName)!=null))throw new Error(`Kernel '${t}' not registered for backend '${this.backendName}'`);return this.runKernelFunc({kernelName:t,inputs:e,attrs:o})}shouldCheckForMemLeaks(){return this.ENV.getBool("IS_TEST")}checkKernelForMemLeak(t,e,o){let n=this.backend.numDataIds(),s=0;o.forEach(c=>{s+=c.dtype==="complex64"?3:1});let a=this.state.numDataMovesStack[this.state.numDataMovesStack.length-1],i=n-e-s-a;if(i>0)throw new Error(`Backend '${this.backendName}' has an internal memory leak (${i} data ids) after running '${t}'`)}runKernelFunc(t){let e,o=[],n=this.isTapeOn(),s=this.state.numBytes,a=this.state.numTensors;this.shouldCheckForMemLeaks()&&this.state.numDataMovesStack.push(0);let i;this.backendName==null&&this.backend;let c,p=yf(t)?t.kernelName:this.state.activeScope!=null?this.state.activeScope.name:"";if(yf(t)){let{kernelName:d,inputs:h,attrs:g}=t;this.backendName==null&&this.backend;let x=of(d,this.backendName);E(x!=null,()=>`Cannot find registered kernel '${d}' for backend '${this.backendName}'`),i=()=>{let b=this.backend.numDataIds();c=x.kernelFunc({inputs:h,attrs:g,backend:this.backend});let S=Array.isArray(c)?c:[c];this.shouldCheckForMemLeaks()&&this.checkKernelForMemLeak(d,b,S);let N=S.map(k=>k.rank!=null?k:this.makeTensorFromTensorInfo(k));if(n){let k=this.getTensorsForGradient(d,h,N);o=this.saveTensorsForBackwardMode(k)}return N}}else{let{forwardFunc:d}=t,h=g=>{n&&(o=g.map(x=>this.keep(this.clone(x))))};i=()=>{let g=this.backend.numDataIds();c=this.tidy(()=>d(this.backend,h));let x=Array.isArray(c)?c:[c];return this.shouldCheckForMemLeaks()&&this.checkKernelForMemLeak(p,g,x),x}}let{inputs:l,attrs:u}=t,m=yf(t)?null:t.backwardsFunc,f;return this.scopedRun(()=>this.state.kernelDepth++,()=>this.state.kernelDepth--,()=>{!this.ENV.getBool("DEBUG")&&!this.state.profiling?e=i():(f=this.profiler.profileKernel(p,l,()=>i()),this.ENV.getBool("DEBUG")&&this.profiler.logKernelProfile(f),e=f.outputs)}),n&&this.addTapeNode(p,l,e,m,o,u),this.state.profiling&&this.state.activeProfile.kernels.push({name:p,bytesAdded:this.state.numBytes-s,totalBytesSnapshot:this.state.numBytes,tensorsAdded:this.state.numTensors-a,totalTensorsSnapshot:this.state.numTensors,inputShapes:Object.keys(l).map(d=>l[d]!=null?l[d].shape:null),outputShapes:e.map(d=>d.shape),kernelTimeMs:f.timeMs,extraInfo:f.extraInfo}),Array.isArray(c)?e:e[0]}saveTensorsForBackwardMode(t){return t.map(o=>this.keep(this.clone(o)))}getTensorsForGradient(t,e,o){let n=nf(t);if(n!=null){let s=n.inputsToSave||[],a=n.outputsToSave||[],i;n.saveAllInputs?(E(Array.isArray(e),()=>"saveAllInputs is true, expected inputs to be an array."),i=Object.keys(e).map(p=>e[p])):i=s.map(p=>e[p]);let c=o.filter((p,l)=>a[l]);return i.concat(c)}return[]}makeTensor(t,e,o,n){if(t==null)throw new Error("Values passed to engine.makeTensor() are null");o=o||"float32",n=n||this.backend;let s=t;o==="string"&&ps(t[0])&&(s=t.map(c=>Ka(c)));let a=n.write(s,e,o),i=new Lt(e,o,a,this.nextTensorId());if(this.trackTensor(i,n),o==="string"){let c=this.state.tensorInfo.get(a),p=Zm(s);this.state.numBytes+=p-c.bytes,c.bytes=p}return i}makeTensorFromDataId(t,e,o,n){o=o||"float32";let s={dataId:t,shape:e,dtype:o};return this.makeTensorFromTensorInfo(s,n)}makeTensorFromTensorInfo(t,e){let{dataId:o,shape:n,dtype:s}=t,a=new Lt(n,s,o,this.nextTensorId());return this.trackTensor(a,e),a}makeVariable(t,e=!0,o,n){o=o||this.nextVariableId().toString(),n!=null&&n!==t.dtype&&(t=t.cast(n));let s=new io(t,e,o,this.nextTensorId());if(this.state.registeredVariables[s.name]!=null)throw new Error(`Variable with name ${s.name} was already registered`);return this.state.registeredVariables[s.name]=s,this.incRef(s,this.backend),s}trackTensor(t,e){this.state.numTensors++,t.dtype==="string"&&this.state.numStringTensors++;let o=0;t.dtype!=="complex64"&&t.dtype!=="string"&&(o=t.size*Vc(t.dtype)),this.state.numBytes+=o,this.state.tensorInfo.has(t.dataId)||(this.state.numDataBuffers++,this.state.tensorInfo.set(t.dataId,{backend:e||this.backend,dtype:t.dtype,shape:t.shape,bytes:o})),t instanceof io||this.track(t)}incRef(t,e){this.trackTensor(t,e),this.backend.incRef(t.dataId)}removeDataId(t,e){this.state.tensorInfo.has(t)&&this.state.tensorInfo.get(t).backend===e&&(this.state.tensorInfo.delete(t),this.state.numDataBuffers--)}disposeTensor(t){if(!this.state.tensorInfo.has(t.dataId))return;let e=this.state.tensorInfo.get(t.dataId);if(this.state.numTensors--,t.dtype==="string"&&(this.state.numStringTensors--,this.state.numBytes-=e.bytes),t.dtype!=="complex64"&&t.dtype!=="string"){let o=t.size*Vc(t.dtype);this.state.numBytes-=o}e.backend.disposeData(t.dataId)&&this.removeDataId(t.dataId,e.backend)}disposeVariables(){for(let t in this.state.registeredVariables){let e=this.state.registeredVariables[t];this.disposeVariable(e)}}disposeVariable(t){this.disposeTensor(t),this.state.registeredVariables[t.name]!=null&&delete this.state.registeredVariables[t.name]}memory(){let t=this.backend.memory();return t.numTensors=this.state.numTensors,t.numDataBuffers=this.state.numDataBuffers,t.numBytes=this.state.numBytes,this.state.numStringTensors>0&&(t.unreliable=!0,t.reasons==null&&(t.reasons=[]),t.reasons.push("Memory usage by string tensors is approximate (2 bytes per character)")),t}async profile(t){this.state.profiling=!0;let e=this.state.numBytes,o=this.state.numTensors;this.state.activeProfile.kernels=[],this.state.activeProfile.result=await t(),this.state.profiling=!1,this.state.activeProfile.peakBytes=Math.max(...this.state.activeProfile.kernels.map(n=>n.totalBytesSnapshot)),this.state.activeProfile.newBytes=this.state.numBytes-e,this.state.activeProfile.newTensors=this.state.numTensors-o;for(let n of this.state.activeProfile.kernels)n.kernelTimeMs=await n.kernelTimeMs,n.extraInfo=await n.extraInfo;return this.state.activeProfile}isTapeOn(){return this.state.gradientDepth>0&&this.state.kernelDepth===0}addTapeNode(t,e,o,n,s,a){let i={id:this.state.nextTapeNodeId++,kernelName:t,inputs:e,outputs:o,saved:s},c=nf(t);c!=null&&(n=c.gradFunc),n!=null&&(i.gradient=p=>(p=p.map((l,u)=>{if(l==null){let m=o[u],f=ms(m.size,m.dtype);return this.makeTensor(f,m.shape,m.dtype)}return l}),n(p.length>1?p:p[0],s,a))),this.state.activeTape.push(i)}keep(t){return t.kept=!0,t}startTape(){this.state.gradientDepth===0&&(this.state.activeTape=[]),this.state.gradientDepth++}endTape(){this.state.gradientDepth--}startScope(t){let e={track:[],name:"unnamed scope",id:this.state.nextScopeId++};t&&(e.name=t),this.state.scopeStack.push(e),this.state.activeScope=e}endScope(t){let e=op(t),o=new Set(e.map(s=>s.id));for(let s=0;s<this.state.activeScope.track.length;s++){let a=this.state.activeScope.track[s];!a.kept&&!o.has(a.id)&&a.dispose()}let n=this.state.scopeStack.pop();this.state.activeScope=this.state.scopeStack.length===0?null:this.state.scopeStack[this.state.scopeStack.length-1],e.forEach(s=>{!s.kept&&s.scopeId===n.id&&this.track(s)})}gradients(t,e,o,n=!1){if(E(e.length>0,()=>"gradients() received an empty list of xs."),o!=null&&o.dtype!=="float32")throw new Error(`dy must have 'float32' dtype, but has '${o.dtype}'`);let s=this.scopedRun(()=>this.startTape(),()=>this.endTape(),()=>this.tidy("forward",t));E(s instanceof Lt,()=>"The result y returned by f() must be a tensor.");let a=bg(this.state.activeTape,e,s);if(!n&&a.length===0&&e.length>0)throw new Error("Cannot compute gradient of y=f(x) with respect to x. Make sure that the f you passed encloses all operations that lead from x to y.");return this.tidy("backward",()=>{let i={};i[s.id]=o??BE(s.shape),Cg(i,a,p=>this.tidy(p),VE);let c=e.map(p=>i[p.id]);return this.state.gradientDepth===0&&(this.state.activeTape.forEach(p=>{for(let l of p.saved)l.dispose()}),this.state.activeTape=null),{value:s,grads:c}})}customGrad(t){return E(Mc(t),()=>"The f passed in customGrad(f) must be a function."),(...e)=>{E(e.every(i=>i instanceof Lt),()=>"The args passed in customGrad(f)(x1, x2,...) must all be tensors");let o,n={};e.forEach((i,c)=>{n[c]=i});let s=(i,c)=>(o=t(...e,c),E(o.value instanceof Lt,()=>"The function f passed in customGrad(f) must return an object where `obj.value` is a tensor"),E(Mc(o.gradFunc),()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function."),o.value),a=(i,c)=>{let p=o.gradFunc(i,c),l=Array.isArray(p)?p:[p];E(l.length===e.length,()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function that returns the same number of tensors as inputs passed to f(...)."),E(l.every(m=>m instanceof Lt),()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function that returns a list of only tensors.");let u={};return l.forEach((m,f)=>{u[f]=()=>m}),u};return this.runKernelFunc({forwardFunc:s,backwardsFunc:a,inputs:n})}}readSync(t){return this.state.tensorInfo.get(t).backend.readSync(t)}read(t){return this.state.tensorInfo.get(t).backend.read(t)}readToGPU(t,e){return this.state.tensorInfo.get(t).backend.readToGPU(t,e)}async time(t){let e=$n(),o=await this.backend.time(t);return o.wallMs=$n()-e,o}track(t){return this.state.activeScope!=null&&(t.scopeId=this.state.activeScope.id,this.state.activeScope.track.push(t)),t}get registeredVariables(){return this.state.registeredVariables}reset(){this.pendingBackendInitId++,this.state.dispose(),this.ENV.reset(),this.state=new np;for(let t in this.registry)this.disposeRegisteredKernels(t),this.registry[t].dispose(),delete this.registry[t];this.backendName=null,this.backendInstance=null,this.pendingBackendInit=null}};Hi.nextTensorId=0;Hi.nextVariableId=0;function BE(r){let t=Pi(xt(r),"float32");return v.makeTensor(t,r,"float32")}function bf(){let r=tf();if(r._tfengine==null){let t=new Vi(r);r._tfengine=new Hi(t)}return eg(r._tfengine.ENV),Ng(()=>r._tfengine),r._tfengine}var v=bf();function VE(r,t){let e={a:r,b:t};return v.runKernel("Add",e)}var co={};At(co,{isBrowser:()=>Tf,isMobile:()=>WE,mockIsMobile:()=>zE});function ME(){return typeof navigator<"u"&&navigator!=null}var Cf;function zE(r){Cf=r}function WE(r){if(Cf!==void 0)return Cf;if(r||ME()){if(r||(r=navigator),r.product==="ReactNative")return!0;let t=r.userAgent||r.vendor||(typeof window<"u"?window.opera:"");if(!t){let e=r;return e.userAgentData&&e.userAgentData.mobile}return/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(t)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(t.substr(0,4))}return!1}function Tf(){return typeof window<"u"&&window.document!=null||typeof WorkerGlobalScope<"u"}var Re=F();Re.registerFlag("DEBUG",()=>!1,r=>{r&&console.warn("Debugging mode is ON. The output of every math call will be downloaded to CPU and checked for NaNs. This significantly impacts performance.")});Re.registerFlag("IS_BROWSER",()=>Tf());Re.registerFlag("IS_NODE",()=>typeof process<"u"&&typeof process.versions<"u"&&typeof process.versions.node<"u");Re.registerFlag("IS_CHROME",()=>typeof navigator<"u"&&navigator!=null&&navigator.userAgent!=null&&/Chrome/.test(navigator.userAgent)&&/Google Inc/.test(navigator.vendor));Re.registerFlag("PROD",()=>!1);Re.registerFlag("TENSORLIKE_CHECK_SHAPE_CONSISTENCY",()=>Re.getBool("DEBUG"));Re.registerFlag("DEPRECATION_WARNINGS_ENABLED",()=>!0);Re.registerFlag("IS_TEST",()=>!1);Re.registerFlag("CHECK_COMPUTATION_FOR_ERRORS",()=>!0);Re.registerFlag("WRAP_TO_IMAGEBITMAP",()=>!1);Re.registerFlag("ENGINE_COMPILE_ONLY",()=>!1);Re.registerFlag("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU",()=>!1);Re.registerFlag("USE_SETTIMEOUTCUSTOM",()=>!1);function we(r,t){let e=r;if(ke(r))return t==="string"?[]:[r.length];if(!Array.isArray(r))return[];let o=[];for(;Array.isArray(e)||ke(e)&&t!=="string";)o.push(e.length),e=e[0];return Array.isArray(r)&&F().getBool("TENSORLIKE_CHECK_SHAPE_CONSISTENCY")&&Rg(r,o,[]),o}function Rg(r,t,e){if(e=e||[],!Array.isArray(r)&&!ke(r)){E(t.length===0,()=>`Element arr[${e.join("][")}] is a primitive, but should be an array/TypedArray of ${t[0]} elements`);return}E(t.length>0,()=>`Element arr[${e.join("][")}] should be a primitive, but is an array of ${r.length} elements`),E(r.length===t[0],()=>`Element arr[${e.join("][")}] should have ${t[0]} elements, but has ${r.length} elements`);let o=t.slice(1);for(let n=0;n<r.length;++n)Rg(r[n],o,e.concat(n))}function $g(r,t,e,o){if(r!=="string_or_numeric"){if(r==null)throw new Error("Expected dtype cannot be null.");if(r!=="numeric"&&r!==t||r==="numeric"&&t==="string")throw new Error(`Argument '${e}' passed to '${o}' must be ${r} tensor, but got ${t} tensor`)}}function T(r,t,e,o="numeric"){if(r instanceof Lt)return $g(o,r.dtype,t,e),r;let n=ls(r);if(n!=="string"&&["bool","int32","float32"].indexOf(o)>=0&&(n=o),$g(o,n,t,e),r==null||!ke(r)&&!Array.isArray(r)&&typeof r!="number"&&typeof r!="boolean"&&typeof r!="string"){let c=r==null?"null":r.constructor.name;throw new Error(`Argument '${t}' passed to '${e}' must be a Tensor or TensorLike, but got '${c}'`)}let s=we(r,n);!ke(r)&&!Array.isArray(r)&&(r=[r]);let i=n!=="string"?Ha(r,n):to(r,[],!0);return v.makeTensor(i,s,n)}function Fn(r,t,e,o="numeric"){if(!Array.isArray(r))throw new Error(`Argument ${t} passed to ${e} must be a \`Tensor[]\` or \`TensorLike[]\``);return r.map((s,a)=>T(s,`${t}[${a}]`,e,o))}var Sf="__op";function w(r){let t=Object.keys(r);if(t.length!==1)throw new Error(`Please provide an object with a single key (operation name) mapping to a function. Got an object with ${t.length} keys.`);let e=t[0],o=r[e];e.endsWith("_")&&(e=e.substring(0,e.length-1)),e=e+Sf;let n=(...s)=>{v.startScope(e);try{let a=o(...s);return Bi(a)&&console.error("Cannot return a Promise inside of tidy."),v.endScope(a),a}catch(a){throw v.endScope(null),a}};return Object.defineProperty(n,"name",{value:e,configurable:!0}),n}function GE(r,t){let e=T(r,"real","complex"),o=T(t,"imag","complex");qt(e.shape,o.shape,`real and imag shapes, ${e.shape} and ${o.shape}, must match in call to tf.complex().`);let n={real:e,imag:o};return v.runKernel(Ss,n)}var Ne=w({complex_:GE});function ye(r,t,e,o){if(o==null&&(o=ls(r)),o==="complex64")throw new Error("Cannot construct a complex64 tensor directly. Please use tf.complex(real, imag).");if(!ke(r)&&!Array.isArray(r)&&typeof r!="number"&&typeof r!="boolean"&&typeof r!="string")throw new Error("values passed to tensor(values) must be a number/boolean/string or an array of numbers/booleans/strings, or a TypedArray");if(t!=null){Li(t);let n=xt(t),s=xt(e);E(n===s,()=>`Based on the provided shape, [${t}], the tensor should have ${n} values but has ${s}`);for(let a=0;a<e.length;++a){let i=e[a],c=a===e.length-1?i!==xt(t.slice(a)):!0;E(e[a]===t[a]||!c,()=>`Error creating a new Tensor. Inferred shape (${e}) does not match the provided shape (${t}). `)}}return!ke(r)&&!Array.isArray(r)&&(r=[r]),t=t||e,r=o!=="string"?Ha(r,o):to(r,[],!0),v.makeTensor(r,t,o)}function me(r,t,e){let o=we(r,e);return ye(r,t,o,e)}var Ki={float32:4,float16:2,int32:4,uint16:2,uint8:1,bool:1,complex64:8};var sp=4;async function Fg(r,t){let e=[],o=[],n=Array.isArray(r)?r.map(a=>a.name):Object.keys(r);for(let a=0;a<n.length;++a){let i=n[a],c=Array.isArray(r)?r[a].tensor:r[i];if(c.dtype!=="float32"&&c.dtype!=="int32"&&c.dtype!=="bool"&&c.dtype!=="string"&&c.dtype!=="complex64")throw new Error(`Unsupported dtype in weight '${i}': ${c.dtype}`);let p={name:i,shape:c.shape,dtype:c.dtype};if(c.dtype==="string"){let l=new Promise(async u=>{let m=await c.bytes(),f=m.reduce((g,x)=>g+x.length,0)+sp*m.length,d=new Uint8Array(f),h=0;for(let g=0;g<m.length;g++){let x=m[g],b=new Uint8Array(new Uint32Array([x.length]).buffer);d.set(b,h),h+=sp,d.set(x,h),h+=x.length}u(d)});o.push(l)}else o.push(c.data());t!=null&&(p.group=t),e.push(p)}let s=await Promise.all(o);return{data:UE(s),specs:e}}function ap(r,t){let e={},o,n=0;for(let s of t){let a=s.name,i=s.dtype,c=s.shape,p=xt(c),l;if("quantization"in s){let u=s.quantization;if(u.dtype==="uint8"||u.dtype==="uint16"){if(!("min"in u&&"scale"in u))throw new Error(`Weight ${s.name} with quantization ${u.dtype} doesn't have corresponding metadata min and scale.`)}else if(u.dtype==="float16"){if(i!=="float32")throw new Error(`Weight ${s.name} is quantized with ${u.dtype} which only supports weights of type float32 not ${i}.`)}else throw new Error(`Weight ${s.name} has unknown quantization dtype ${u.dtype}. Supported quantization dtypes are: 'uint8', 'uint16', and 'float16'.`);let m=Ki[u.dtype],f=r.slice(n,n+p*m),d=u.dtype==="uint8"?new Uint8Array(f):new Uint16Array(f);if(i==="float32")if(u.dtype==="uint8"||u.dtype==="uint16"){l=new Float32Array(d.length);for(let h=0;h<d.length;h++){let g=d[h];l[h]=g*u.scale+u.min}}else if(u.dtype==="float16")o===void 0&&(o=XE()),l=o(d);else throw new Error(`Unsupported quantization type ${u.dtype} for weight type float32.`);else if(i==="int32"){if(u.dtype!=="uint8"&&u.dtype!=="uint16")throw new Error(`Unsupported quantization type ${u.dtype} for weight type int32.`);l=new Int32Array(d.length);for(let h=0;h<d.length;h++){let g=d[h];l[h]=Math.round(g*u.scale+u.min)}}else throw new Error(`Unsupported dtype in weight '${a}': ${i}`);n+=p*m}else if(i==="string"){let u=xt(s.shape);l=[];for(let m=0;m<u;m++){let f=new Uint32Array(r.slice(n,n+sp))[0];n+=sp;let d=new Uint8Array(r.slice(n,n+f));l.push(d),n+=f}}else{let u=Ki[i],m=r.slice(n,n+p*u);if(i==="float32")l=new Float32Array(m);else if(i==="int32")l=new Int32Array(m);else if(i==="bool")l=new Uint8Array(m);else if(i==="complex64"){l=new Float32Array(m);let f=new Float32Array(l.length/2),d=new Float32Array(l.length/2);for(let x=0;x<f.length;x++)f[x]=l[x*2],d[x]=l[x*2+1];let h=me(f,c,"float32"),g=me(d,c,"float32");e[a]=Ne(h,g),h.dispose(),g.dispose()}else throw new Error(`Unsupported dtype in weight '${a}': ${i}`);n+=p*u}i!=="complex64"&&(e[a]=me(l,c,i))}return e}function UE(r){if(r===null)throw new Error(`Invalid input value: ${JSON.stringify(r)}`);let t=0,e=[];r.forEach(s=>{if(t+=s.byteLength,e.push(s.byteLength===s.buffer.byteLength?s:new s.constructor(s)),!(s instanceof Float32Array||s instanceof Int32Array||s instanceof Uint8Array))throw new Error(`Unsupported TypedArray subtype: ${s.constructor.name}`)});let o=new Uint8Array(t),n=0;return e.forEach(s=>{o.set(new Uint8Array(s.buffer),n),n+=s.byteLength}),o.buffer}var wf=typeof Buffer<"u"&&(typeof Blob>"u"||typeof atob>"u"||typeof btoa>"u");function Ag(r){return wf?Buffer.byteLength(r):new Blob([r]).size}function Dg(r){if(wf)return Buffer.from(r).toString("base64");let t=new Uint8Array(r),e="";for(let o=0,n=t.length;o<n;o++)e+=String.fromCharCode(t[o]);return btoa(e)}function _g(r){if(wf){let o=Buffer.from(r,"base64");return o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength)}let t=atob(r),e=new Uint8Array(t.length);for(let o=0;o<t.length;++o)e.set([t.charCodeAt(o)],o);return e.buffer}function ja(r){if(r.length===1)return r[0];let t=0;r.forEach(n=>{t+=n.byteLength});let e=new Uint8Array(t),o=0;return r.forEach(n=>{e.set(new Uint8Array(n),o),o+=n.byteLength}),e.buffer}function Nf(r){for(r=r.trim();r.endsWith("/");)r=r.slice(0,r.length-1);let e=r.split("/");return e[e.length-1]}function ip(r,t){let e={modelTopology:r.modelTopology,format:r.format,generatedBy:r.generatedBy,convertedBy:r.convertedBy,weightsManifest:t};return r.signature!=null&&(e.signature=r.signature),r.userDefinedMetadata!=null&&(e.userDefinedMetadata=r.userDefinedMetadata),r.modelInitializer!=null&&(e.modelInitializer=r.modelInitializer),r.trainingConfig!=null&&(e.trainingConfig=r.trainingConfig),e}function If(r,t,e){let o={modelTopology:r.modelTopology,format:r.format,generatedBy:r.generatedBy,convertedBy:r.convertedBy};if(r.trainingConfig!=null&&(o.trainingConfig=r.trainingConfig),r.weightsManifest!=null){if(!t)throw new Error("modelJSON has weightsManifest but weightSpecs is null");if(!e)throw new Error("modelJSON has weightsManifest but weightData is null");o.weightSpecs=t,o.weightData=e}return r.signature!=null&&(o.signature=r.signature),r.userDefinedMetadata!=null&&(o.userDefinedMetadata=r.userDefinedMetadata),r.modelInitializer!=null&&(o.modelInitializer=r.modelInitializer),o}async function Ya(r,t){let e,o;return r.weightsManifest!=null&&([e,o]=await t(r.weightsManifest)),If(r,e,o)}function yr(r){if(r.modelTopology instanceof ArrayBuffer)throw new Error("Expected JSON model topology, received ArrayBuffer.");return{dateSaved:new Date,modelTopologyType:"JSON",modelTopologyBytes:r.modelTopology==null?0:Ag(JSON.stringify(r.modelTopology)),weightSpecsBytes:r.weightSpecs==null?0:Ag(JSON.stringify(r.weightSpecs)),weightDataBytes:r.weightData==null?0:r.weightData.byteLength}}function cp(r){let t=[];for(let e of r)t.push(...e.weights);return t}function HE(){let r=e=>{let o=e<<13,n=0;for(;(o&8388608)===0;)n-=8388608,o<<=1;return o&=-8388609,n+=947912704,o|n},t=new Uint32Array(2048);t[0]=0;for(let e=1;e<1024;e++)t[e]=r(e);for(let e=1024;e<2048;e++)t[e]=939524096+(e-1024<<13);return t}function KE(){let r=new Uint32Array(64);r[0]=0,r[31]=1199570944,r[32]=2147483648,r[63]=3347054592;for(let t=1;t<31;t++)r[t]=t<<23;for(let t=33;t<63;t++)r[t]=2147483648+(t-32<<23);return r}function qE(){let r=new Uint32Array(64);for(let t=0;t<64;t++)r[t]=1024;return r[0]=r[32]=0,r}function XE(){let r=HE(),t=KE(),e=qE();return o=>{let n=new ArrayBuffer(4*o.length),s=new Uint32Array(n);for(let a=0;a<o.length;a++){let i=o[a],c=r[e[i>>10]+(i&1023)]+t[i>>10];s[a]=c}return new Float32Array(n)}}var oe=class r{constructor(){this.saveRouters=[],this.loadRouters=[]}static getInstance(){return r.instance==null&&(r.instance=new r),r.instance}static registerSaveRouter(t){r.getInstance().saveRouters.push(t)}static registerLoadRouter(t){r.getInstance().loadRouters.push(t)}static getSaveHandlers(t){return r.getHandlers(t,"save")}static getLoadHandlers(t,e){return r.getHandlers(t,"load",e)}static getHandlers(t,e,o){let n=[];return(e==="load"?r.getInstance().loadRouters:r.getInstance().saveRouters).forEach(a=>{let i=a(t,o);i!==null&&n.push(i)}),n}},Og=r=>oe.registerSaveRouter(r),Pg=r=>oe.registerLoadRouter(r),Lg=r=>oe.getSaveHandlers(r),Bg=(r,t)=>oe.getLoadHandlers(r,t);var vf="tensorflowjs",kf=1,Dn="models_store",po="model_info_store";function Vg(){if(!F().getBool("IS_BROWSER"))throw new Error("Failed to obtain IndexedDB factory because the current environmentis not a web browser.");let r=typeof window>"u"?self:window,t=r.indexedDB||r.mozIndexedDB||r.webkitIndexedDB||r.msIndexedDB||r.shimIndexedDB;if(t==null)throw new Error("The current browser does not appear to support IndexedDB.");return t}function Ef(r){let t=r.result;t.createObjectStore(Dn,{keyPath:"modelPath"}),t.createObjectStore(po,{keyPath:"modelPath"})}var br=class{constructor(t){if(this.indexedDB=Vg(),t==null||!t)throw new Error("For IndexedDB, modelPath must not be null, undefined or empty.");this.modelPath=t}async save(t){if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserLocalStorage.save() does not support saving model topology in binary formats yet.");return this.databaseAction(this.modelPath,t)}async load(){return this.databaseAction(this.modelPath)}databaseAction(t,e){return new Promise((o,n)=>{let s=this.indexedDB.open(vf,kf);s.onupgradeneeded=()=>Ef(s),s.onsuccess=()=>{let a=s.result;if(e==null){let i=a.transaction(Dn,"readonly"),p=i.objectStore(Dn).get(this.modelPath);p.onsuccess=()=>{if(p.result==null)return a.close(),n(new Error(`Cannot find model with path '${this.modelPath}' in IndexedDB.`));o(p.result.modelArtifacts)},p.onerror=l=>(a.close(),n(p.error)),i.oncomplete=()=>a.close()}else{let i=yr(e),c=a.transaction(po,"readwrite"),p=c.objectStore(po),l=p.put({modelPath:this.modelPath,modelArtifactsInfo:i}),u;l.onsuccess=()=>{u=a.transaction(Dn,"readwrite");let f=u.objectStore(Dn).put({modelPath:this.modelPath,modelArtifacts:e,modelArtifactsInfo:i});f.onsuccess=()=>o({modelArtifactsInfo:i}),f.onerror=d=>{p=c.objectStore(po);let h=p.delete(this.modelPath);h.onsuccess=()=>(a.close(),n(f.error)),h.onerror=g=>(a.close(),n(f.error))}},l.onerror=m=>(a.close(),n(l.error)),c.oncomplete=()=>{u==null?a.close():u.oncomplete=()=>a.close()}}},s.onerror=a=>n(s.error)})}};br.URL_SCHEME="indexeddb://";var Mg=r=>F().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(br.URL_SCHEME)?jE(r.slice(br.URL_SCHEME.length)):null;oe.registerSaveRouter(Mg);oe.registerLoadRouter(Mg);function jE(r){return new br(r)}function YE(r){return r.startsWith(br.URL_SCHEME)?r.slice(br.URL_SCHEME.length):r}var pp=class{constructor(){this.indexedDB=Vg()}async listModels(){return new Promise((t,e)=>{let o=this.indexedDB.open(vf,kf);o.onupgradeneeded=()=>Ef(o),o.onsuccess=()=>{let n=o.result,s=n.transaction(po,"readonly"),i=s.objectStore(po).getAll();i.onsuccess=()=>{let c={};for(let p of i.result)c[p.modelPath]=p.modelArtifactsInfo;t(c)},i.onerror=c=>(n.close(),e(i.error)),s.oncomplete=()=>n.close()},o.onerror=n=>e(o.error)})}async removeModel(t){return t=YE(t),new Promise((e,o)=>{let n=this.indexedDB.open(vf,kf);n.onupgradeneeded=()=>Ef(n),n.onsuccess=()=>{let s=n.result,a=s.transaction(po,"readwrite"),i=a.objectStore(po),c=i.get(t),p;c.onsuccess=()=>{if(c.result==null)return s.close(),o(new Error(`Cannot find model with path '${t}' in IndexedDB.`));{let l=i.delete(t),u=()=>{p=s.transaction(Dn,"readwrite");let f=p.objectStore(Dn).delete(t);f.onsuccess=()=>e(c.result.modelArtifactsInfo),f.onerror=d=>o(c.error)};l.onsuccess=u,l.onerror=m=>(u(),s.close(),o(c.error))}},c.onerror=l=>(s.close(),o(c.error)),a.oncomplete=()=>{p==null?s.close():p.oncomplete=()=>s.close()}},n.onerror=s=>o(n.error)})}};var Br="/",Za="tensorflowjs_models",zg="info",ZE="model_topology",QE="weight_specs",JE="weight_data",t$="model_metadata";function Wg(r){return{info:[Za,r,zg].join(Br),topology:[Za,r,ZE].join(Br),weightSpecs:[Za,r,QE].join(Br),weightData:[Za,r,JE].join(Br),modelMetadata:[Za,r,t$].join(Br)}}function Gg(r){for(let t of Object.values(r))window.localStorage.removeItem(t)}function e$(r){let t=r.split(Br);if(t.length<3)throw new Error(`Invalid key format: ${r}`);return t.slice(1,t.length-1).join(Br)}function r$(r){return r.startsWith(Cr.URL_SCHEME)?r.slice(Cr.URL_SCHEME.length):r}var Cr=class{constructor(t){if(!F().getBool("IS_BROWSER")||typeof window>"u"||typeof window.localStorage>"u")throw new Error("The current environment does not support local storage.");if(this.LS=window.localStorage,t==null||!t)throw new Error("For local storage, modelPath must not be null, undefined or empty.");this.modelPath=t,this.keys=Wg(this.modelPath)}async save(t){if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserLocalStorage.save() does not support saving model topology in binary formats yet.");{let e=JSON.stringify(t.modelTopology),o=JSON.stringify(t.weightSpecs),n=yr(t);try{this.LS.setItem(this.keys.info,JSON.stringify(n)),this.LS.setItem(this.keys.topology,e),this.LS.setItem(this.keys.weightSpecs,o),this.LS.setItem(this.keys.weightData,Dg(t.weightData));let s={format:t.format,generatedBy:t.generatedBy,convertedBy:t.convertedBy,signature:t.signature!=null?t.signature:void 0,userDefinedMetadata:t.userDefinedMetadata!=null?t.userDefinedMetadata:void 0,modelInitializer:t.modelInitializer!=null?t.modelInitializer:void 0,trainingConfig:t.trainingConfig!=null?t.trainingConfig:void 0};return this.LS.setItem(this.keys.modelMetadata,JSON.stringify(s)),{modelArtifactsInfo:n}}catch{throw Gg(this.keys),new Error(`Failed to save model '${this.modelPath}' to local storage: size quota being exceeded is a possible cause of this failure: modelTopologyBytes=${n.modelTopologyBytes}, weightSpecsBytes=${n.weightSpecsBytes}, weightDataBytes=${n.weightDataBytes}.`)}}}async load(){let t=JSON.parse(this.LS.getItem(this.keys.info));if(t==null)throw new Error(`In local storage, there is no model with name '${this.modelPath}'`);if(t.modelTopologyType!=="JSON")throw new Error("BrowserLocalStorage does not support loading non-JSON model topology yet.");let e={},o=JSON.parse(this.LS.getItem(this.keys.topology));if(o==null)throw new Error(`In local storage, the topology of model '${this.modelPath}' is missing.`);e.modelTopology=o;let n=JSON.parse(this.LS.getItem(this.keys.weightSpecs));if(n==null)throw new Error(`In local storage, the weight specs of model '${this.modelPath}' are missing.`);e.weightSpecs=n;let s=this.LS.getItem(this.keys.modelMetadata);if(s!=null){let i=JSON.parse(s);e.format=i.format,e.generatedBy=i.generatedBy,e.convertedBy=i.convertedBy,i.signature!=null&&(e.signature=i.signature),i.userDefinedMetadata!=null&&(e.userDefinedMetadata=i.userDefinedMetadata),i.modelInitializer!=null&&(e.modelInitializer=i.modelInitializer),i.trainingConfig!=null&&(e.trainingConfig=i.trainingConfig)}let a=this.LS.getItem(this.keys.weightData);if(a==null)throw new Error(`In local storage, the binary weight values of model '${this.modelPath}' are missing.`);return e.weightData=_g(a),e}};Cr.URL_SCHEME="localstorage://";var Ug=r=>F().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(Cr.URL_SCHEME)?o$(r.slice(Cr.URL_SCHEME.length)):null;oe.registerSaveRouter(Ug);oe.registerLoadRouter(Ug);function o$(r){return new Cr(r)}var lp=class{constructor(){E(F().getBool("IS_BROWSER"),()=>"Current environment is not a web browser"),E(typeof window>"u"||typeof window.localStorage<"u",()=>"Current browser does not appear to support localStorage"),this.LS=window.localStorage}async listModels(){let t={},e=Za+Br,o=Br+zg;for(let n=0;n<this.LS.length;++n){let s=this.LS.key(n);if(s.startsWith(e)&&s.endsWith(o)){let a=e$(s);t[a]=JSON.parse(this.LS.getItem(s))}}return t}async removeModel(t){t=r$(t);let e=Wg(t);if(this.LS.getItem(e.info)==null)throw new Error(`Cannot find model at path '${t}'`);let o=JSON.parse(this.LS.getItem(e.info));return Gg(e),o}};var Qa="://",pr=class r{constructor(){this.managers={}}static getInstance(){return r.instance==null&&(r.instance=new r),r.instance}static registerManager(t,e){E(t!=null,()=>"scheme must not be undefined or null."),t.endsWith(Qa)&&(t=t.slice(0,t.indexOf(Qa))),E(t.length>0,()=>"scheme must not be an empty string.");let o=r.getInstance();E(o.managers[t]==null,()=>`A model store manager is already registered for scheme '${t}'.`),o.managers[t]=e}static getManager(t){let e=r.getInstance().managers[t];if(e==null)throw new Error(`Cannot find model manager for scheme '${t}'`);return e}static getSchemes(){return Object.keys(r.getInstance().managers)}};function up(r){if(r.indexOf(Qa)===-1)throw new Error(`The url string provided does not contain a scheme. Supported schemes are: ${pr.getSchemes().join(",")}`);return{scheme:r.split(Qa)[0],path:r.split(Qa)[1]}}async function Hg(r,t,e=!1){E(r!==t,()=>`Old path and new path are the same: '${r}'`);let o=oe.getLoadHandlers(r);E(o.length>0,()=>`Copying failed because no load handler is found for source URL ${r}.`),E(o.length<2,()=>`Copying failed because more than one (${o.length}) load handlers for source URL ${r}.`);let n=o[0],s=oe.getSaveHandlers(t);E(s.length>0,()=>`Copying failed because no save handler is found for destination URL ${t}.`),E(s.length<2,()=>`Copying failed because more than one (${o.length}) save handlers for destination URL ${t}.`);let a=s[0],i=up(r).scheme,c=up(r).path,p=i===up(r).scheme,l=await n.load();e&&p&&await pr.getManager(i).removeModel(c);let u=await a.save(l);return e&&!p&&await pr.getManager(i).removeModel(c),u.modelArtifactsInfo}async function Kg(){let r=pr.getSchemes(),t={};for(let e of r){let o=await pr.getManager(e).listModels();for(let n in o){let s=e+Qa+n;t[s]=o[n]}}return t}async function qg(r){let t=up(r);return pr.getManager(t.scheme).removeModel(t.path)}async function Xg(r,t){return Hg(r,t,!1)}async function jg(r,t){return Hg(r,t,!0)}var $f=class{constructor(){this.messageName="setTimeoutCustom",this.functionRefs=[],this.handledMessageCount=0,this.hasEventListener=!1}fetch(t,e){return fetch(t,e)}now(){return performance.now()}encode(t,e){if(e!=="utf-8"&&e!=="utf8")throw new Error(`Browser's encoder only supports utf-8, but got ${e}`);return this.textEncoder==null&&(this.textEncoder=new TextEncoder),this.textEncoder.encode(t)}decode(t,e){return new TextDecoder(e).decode(t)}setTimeoutCustom(t,e){if(!window||!F().getBool("USE_SETTIMEOUTCUSTOM")){setTimeout(t,e);return}this.functionRefs.push(t),setTimeout(()=>{window.postMessage({name:this.messageName,index:this.functionRefs.length-1},"*")},e),this.hasEventListener||(this.hasEventListener=!0,window.addEventListener("message",o=>{if(o.source===window&&o.data.name===this.messageName){o.stopPropagation();let n=this.functionRefs[o.data.index];n(),this.handledMessageCount++,this.handledMessageCount===this.functionRefs.length&&(this.functionRefs=[],this.handledMessageCount=0)}},!0))}};if(F().get("IS_BROWSER")){F().setPlatform("browser",new $f);try{pr.registerManager(Cr.URL_SCHEME,new lp)}catch{}try{pr.registerManager(br.URL_SCHEME,new pp)}catch{}}var n$={importFetch:()=>Yg()},Rf;var Af=class{constructor(){this.util=Zg(),this.textEncoder=new this.util.TextEncoder}fetch(t,e){return F().global.fetch!=null?F().global.fetch(t,e):(Rf==null&&(Rf=n$.importFetch()),Rf(t,e))}now(){let t=process.hrtime();return t[0]*1e3+t[1]/1e6}encode(t,e){if(e!=="utf-8"&&e!=="utf8")throw new Error(`Node built-in encoder only supports utf-8, but got ${e}`);return this.textEncoder.encode(t)}decode(t,e){return t.length===0?"":new this.util.TextDecoder(e).decode(t)}};F().get("IS_NODE")&&!F().get("IS_BROWSER")&&F().setPlatform("node",new Af);function tt(r,t="float32",e){return t=t||"float32",Li(r),new vt(r,t,e)}function s$(r,t){let e=T(r,"x","cast");if(!Ym(t))throw new Error(`Failed to cast to unknown dtype ${t}`);if(t==="string"&&e.dtype!=="string"||t!=="string"&&e.dtype==="string")throw new Error("Only strings can be casted to strings");let o={x:e},n={dtype:t};return v.runKernel(ro,o,n)}var kt=w({cast_:s$});function a$(r){let e={x:T(r,"x","clone","string_or_numeric")};return v.runKernel(oo,e)}var Ae=w({clone_:a$});function mp(r,t=!1){console.log(r.toString(t))}bf();var i$={buffer:tt,cast:kt,clone:Ae,print:mp};Ig(i$);var ji={};At(ji,{browserFiles:()=>Jg,browserHTTPRequest:()=>rx,concatenateArrayBuffers:()=>ja,copyModel:()=>Xg,decodeWeights:()=>ap,encodeWeights:()=>Fg,fromMemory:()=>ox,fromMemorySync:()=>Lf,getLoadHandlers:()=>Bg,getModelArtifactsForJSON:()=>Ya,getModelArtifactsForJSONSync:()=>If,getModelArtifactsInfoForJSON:()=>yr,getSaveHandlers:()=>Lg,getWeightSpecs:()=>cp,http:()=>dp,isHTTPScheme:()=>fp,listModels:()=>Kg,loadWeights:()=>tx,moveModel:()=>jg,registerLoadRouter:()=>Pg,registerSaveRouter:()=>Og,removeModel:()=>qg,weightsLoaderFactory:()=>Of,withSaveHandler:()=>nx,withSaveHandlerSync:()=>sx});var c$="model",p$=".json",l$=".weights.bin";function Qg(r){return new Promise(t=>setTimeout(t)).then(r)}var Ja=class r{constructor(t){if(!F().getBool("IS_BROWSER"))throw new Error("browserDownloads() cannot proceed because the current environment is not a browser.");t.startsWith(r.URL_SCHEME)&&(t=t.slice(r.URL_SCHEME.length)),(t==null||t.length===0)&&(t=c$),this.modelJsonFileName=t+p$,this.weightDataFileName=t+l$}async save(t){if(typeof document>"u")throw new Error("Browser downloads are not supported in this environment since `document` is not present");let e=window.URL.createObjectURL(new Blob([t.weightData],{type:"application/octet-stream"}));if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserDownloads.save() does not support saving model topology in binary formats yet.");{let o=[{paths:["./"+this.weightDataFileName],weights:t.weightSpecs}],n=ip(t,o),s=window.URL.createObjectURL(new Blob([JSON.stringify(n)],{type:"application/json"})),a=this.modelJsonAnchor==null?document.createElement("a"):this.modelJsonAnchor;if(a.download=this.modelJsonFileName,a.href=s,await Qg(()=>a.dispatchEvent(new MouseEvent("click"))),t.weightData!=null){let i=this.weightDataAnchor==null?document.createElement("a"):this.weightDataAnchor;i.download=this.weightDataFileName,i.href=e,await Qg(()=>i.dispatchEvent(new MouseEvent("click")))}return{modelArtifactsInfo:yr(t)}}}};Ja.URL_SCHEME="downloads://";var Ff=class{constructor(t){if(t==null||t.length<1)throw new Error(`When calling browserFiles, at least 1 file is required, but received ${t}`);this.jsonFile=t[0],this.weightsFiles=t.slice(1)}async load(){return new Promise((t,e)=>{let o=new FileReader;o.onload=n=>{let s=JSON.parse(n.target.result),a=s.modelTopology;if(a==null){e(new Error(`modelTopology field is missing from file ${this.jsonFile.name}`));return}if(s.weightsManifest==null){e(new Error(`weightManifest field is missing from file ${this.jsonFile.name}`));return}if(this.weightsFiles.length===0){t({modelTopology:a});return}let c=Ya(s,p=>this.loadWeights(p));t(c)},o.onerror=n=>e(`Failed to read model topology and weights manifest JSON from file '${this.jsonFile.name}'. BrowserFiles supports loading Keras-style tf.Model artifacts only.`),o.readAsText(this.jsonFile)})}loadWeights(t){let e=[],o=[];for(let a of t)e.push(...a.weights),o.push(...a.paths);let n=this.checkManifestAndWeightFiles(t),s=o.map(a=>this.loadWeightsFile(a,n[a]));return Promise.all(s).then(a=>[e,ja(a)])}loadWeightsFile(t,e){return new Promise((o,n)=>{let s=new FileReader;s.onload=a=>{let i=a.target.result;o(i)},s.onerror=a=>n(`Failed to weights data from file of path '${t}'.`),s.readAsArrayBuffer(e)})}checkManifestAndWeightFiles(t){let e=[],o=this.weightsFiles.map(s=>Nf(s.name)),n={};for(let s of t)s.paths.forEach(a=>{let i=Nf(a);if(e.indexOf(i)!==-1)throw new Error(`Duplicate file basename found in weights manifest: '${i}'`);if(e.push(i),o.indexOf(i)===-1)throw new Error(`Weight file with basename '${i}' is not provided.`);n[a]=this.weightsFiles[o.indexOf(i)]});if(e.length!==this.weightsFiles.length)throw new Error(`Mismatch in the number of files in weights manifest (${e.length}) and the number of weight files provided (${this.weightsFiles.length}).`);return n}},u$=r=>F().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(Ja.URL_SCHEME)?m$(r.slice(Ja.URL_SCHEME.length)):null;oe.registerSaveRouter(u$);function m$(r="model"){return new Ja(r)}function Jg(r){return new Ff(r)}function Df(r,t,e,o){a(r),e=e??0,o=o??1,i(e,o);let n=0,s=c=>(c.then(p=>{let l=e+ ++n/r.length*(o-e);return t(l),p}),c);function a(c){E(c!=null&&Array.isArray(c)&&c.length>0,()=>"promises must be a none empty array")}function i(c,p){E(c>=0&&c<=1,()=>`Progress fraction must be in range [0, 1], but got startFraction ${c}`),E(p>=0&&p<=1,()=>`Progress fraction must be in range [0, 1], but got endFraction ${p}`),E(p>=c,()=>`startFraction must be no more than endFraction, but got startFraction ${c} and endFraction ${p}`)}return Promise.all(r.map(s))}async function _f(r,t){t==null&&(t={});let e=t.fetchFunc==null?F().platform.fetch:t.fetchFunc,o=r.map(u=>e(u,t.requestInit,{isBinary:!0})),i=(t.onProgress==null?await Promise.all(o):await Df(o,t.onProgress,0,.5)).map(u=>u.arrayBuffer());return t.onProgress==null?await Promise.all(i):await Df(i,t.onProgress,.5,1)}async function tx(r,t="",e,o){return Of(a=>_f(a,{requestInit:o}))(r,t,e)}function Of(r){return async(t,e="",o)=>{let n=t.map(()=>!1),s={},a=o!=null?o.map(()=>!1):[],i=[];if(t.forEach((f,d)=>{let h=0;f.weights.forEach(g=>{let x="quantization"in g?g.quantization.dtype:g.dtype,b=Ki[x]*xt(g.shape),S=()=>{n[d]=!0,s[d]==null&&(s[d]=[]),s[d].push({manifestEntry:g,groupOffset:h,sizeBytes:b})};o!=null?o.forEach((N,k)=>{N===g.name&&(S(),a[k]=!0)}):S(),i.push(g.name),h+=b})}),!a.every(f=>f)){let f=o.filter((d,h)=>!a[h]);throw new Error(`Could not find weights in manifest with names: ${f.join(", ")}. 
Manifest JSON has weights with names: ${i.join(", ")}.`)}let c=n.reduce((f,d,h)=>(d&&f.push(h),f),[]),p=[];c.forEach(f=>{t[f].paths.forEach(d=>{let h=e+(e.endsWith("/")?"":"/")+d;p.push(h)})});let l=await r(p),u={},m=0;return c.forEach(f=>{let d=t[f].paths.length,h=0;for(let N=0;N<d;N++)h+=l[m+N].byteLength;let g=new ArrayBuffer(h),x=new Uint8Array(g),b=0;for(let N=0;N<d;N++){let k=new Uint8Array(l[m+N]);x.set(k,b),b+=k.byteLength}s[f].forEach(N=>{let k=g.slice(N.groupOffset,N.groupOffset+N.sizeBytes),$=ap(k,[N.manifestEntry]);for(let R in $)u[R]=$[R]}),m+=d}),u}}var f$="application/octet-stream",d$="application/json",qi=class{constructor(t,e){if(this.DEFAULT_METHOD="POST",e==null&&(e={}),this.weightPathPrefix=e.weightPathPrefix,this.onProgress=e.onProgress,this.weightUrlConverter=e.weightUrlConverter,e.fetchFunc!=null?(E(typeof e.fetchFunc=="function",()=>"Must pass a function that matches the signature of `fetch` (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)"),this.fetch=e.fetchFunc):this.fetch=F().platform.fetch,E(t!=null&&t.length>0,()=>"URL path for http must not be null, undefined or empty."),Array.isArray(t)&&E(t.length===2,()=>`URL paths for http must have a length of 2, (actual length is ${t.length}).`),this.path=t,e.requestInit!=null&&e.requestInit.body!=null)throw new Error("requestInit is expected to have no pre-existing body, but has one.");this.requestInit=e.requestInit||{}}async save(t){if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserHTTPRequest.save() does not support saving model topology in binary formats yet.");let e=Object.assign({method:this.DEFAULT_METHOD},this.requestInit);e.body=new FormData;let o=[{paths:["./model.weights.bin"],weights:t.weightSpecs}],n=ip(t,o);e.body.append("model.json",new Blob([JSON.stringify(n)],{type:d$}),"model.json"),t.weightData!=null&&e.body.append("model.weights.bin",new Blob([t.weightData],{type:f$}),"model.weights.bin");let s=await this.fetch(this.path,e);if(s.ok)return{modelArtifactsInfo:yr(t),responses:[s]};throw new Error(`BrowserHTTPRequest.save() failed due to HTTP response status ${s.status}.`)}async load(){let t=await this.fetch(this.path,this.requestInit);if(!t.ok)throw new Error(`Request to ${this.path} failed with status code ${t.status}. Please verify this URL points to the model JSON of the model to load.`);let e;try{e=await t.json()}catch{let a=`Failed to parse model JSON of response from ${this.path}.`;throw this.path.endsWith(".pb")?a+=" Your path contains a .pb file extension. Support for .pb models have been removed in TensorFlow.js 1.0 in favor of .json models. You can re-convert your Python TensorFlow model using the TensorFlow.js 1.0 conversion scripts or you can convert your.pb models with the 'pb2json'NPM script in the tensorflow/tfjs-converter repository.":a+=" Please make sure the server is serving valid JSON for this request.",new Error(a)}let o=e.modelTopology,n=e.weightsManifest;if(o==null&&n==null)throw new Error(`The JSON from HTTP path ${this.path} contains neither model topology or manifest for weights.`);return Ya(e,s=>this.loadWeights(s))}async loadWeights(t){let e=Array.isArray(this.path)?this.path[1]:this.path,[o,n]=h$(e),s=this.weightPathPrefix||o,a=cp(t),i=[],c=[];for(let l of t)for(let u of l.paths)this.weightUrlConverter!=null?c.push(this.weightUrlConverter(u)):i.push(s+u+n);this.weightUrlConverter&&i.push(...await Promise.all(c));let p=await _f(i,{requestInit:this.requestInit,fetchFunc:this.fetch,onProgress:this.onProgress});return[a,ja(p)]}};qi.URL_SCHEME_REGEX=/^https?:\/\//;function h$(r){let t=r.lastIndexOf("/"),e=r.lastIndexOf("?"),o=r.substring(0,t),n=e>t?r.substring(e):"";return[o+"/",n]}function fp(r){return r.match(qi.URL_SCHEME_REGEX)!=null}var ex=(r,t)=>{if(typeof fetch>"u"&&(t==null||t.fetchFunc==null))return null;{let e=!0;if(Array.isArray(r)?e=r.every(o=>fp(o)):e=fp(r),e)return dp(r,t)}return null};oe.registerSaveRouter(ex);oe.registerLoadRouter(ex);function dp(r,t){return new qi(r,t)}function rx(r,t){return dp(r,t)}var Xi=class{constructor(t){this.modelArtifacts=t}load(){return this.modelArtifacts}},hp=class{constructor(t){this.saveHandler=t}save(t){return this.saveHandler(t)}},Pf=class{constructor(t){t.load&&(this.load=()=>Promise.resolve(t.load())),t.save&&(this.save=e=>Promise.resolve(t.save(e)))}};function ox(r,t,e,o){let n=arguments;return new Pf(Lf(...n))}function Lf(r,t,e,o){return arguments.length===1?r.modelTopology!=null||r.weightSpecs!=null?new Xi(r):(console.warn("Please call tf.io.fromMemory() with only one argument. The argument should be of type ModelArtifacts. The multi-argument signature of tf.io.fromMemory() has been deprecated and will be removed in a future release."),new Xi({modelTopology:r})):(console.warn("Please call tf.io.fromMemory() with only one argument. The argument should be of type ModelArtifacts. The multi-argument signature of tf.io.fromMemory() has been deprecated and will be removed in a future release."),new Xi({modelTopology:r,weightSpecs:t,weightData:e,trainingConfig:o}))}function nx(r){return new hp(r)}function sx(r){return new hp(r)}function g$(r,t,e=!1,o=!1){let n=T(r,"a","matMul"),s=T(t,"b","matMul");[n,s]=ft(n,s);let a={a:n,b:s},i={transposeA:e,transposeB:o};return v.runKernel(ys,a,i)}var St=w({matMul_:g$});function x$(r,t,e=1,o=0,n="int32"){if(t<2)throw new Error(`Error in oneHot: depth must be >=2, but it is ${t}`);let a={indices:T(r,"indices","oneHot","int32")},i={dtype:n,depth:t,onValue:e,offValue:o};return v.runKernel(ia,a,i)}var ax=w({oneHot_:x$});function y$(r){F().getBool("DEPRECATION_WARNINGS_ENABLED")&&console.warn(r+" You can disable deprecation warnings with tf.disableDeprecationWarnings().")}vg(y$);function lr(){return v}function b$(){return v.memory()}function Jt(r,t){return v.tidy(r,t)}function Bf(r){op(r).forEach(e=>e.dispose())}function ur(r){return v.keep(r)}function C$(r){return v.setBackend(r)}function T$(){return v.ready()}function S$(){return v.backendName}function gp(r,t,e=1){return v.registerBackend(r,t,e)}function w$(r){let e={input:T(r,"input","imag")};return v.runKernel(Xs,e)}var lo=w({imag_:w$});function N$(r){let e={x:T(r,"x","neg")};return v.runKernel("Neg",e)}var be=w({neg_:N$});function I$(r){let e={input:T(r,"input","real")};return v.runKernel(ha,e)}var Vr=w({real_:I$});function v$(r,t,e){let o=T(r,"x","transpose");if(t==null&&(t=o.shape.map((a,i)=>i).reverse()),E(o.rank===t.length,()=>`Error in transpose: rank of input ${o.rank} must match length of perm ${t}.`),t.forEach(a=>{E(a>=0&&a<o.rank,()=>`All entries in 'perm' must be between 0 and ${o.rank-1} but got ${t}`)}),o.rank<=1)return o.clone();let n={x:o},s={perm:t};return o.dtype==="complex64"?Jt(()=>{let a=Vr(o),i=lo(o);return a=v.runKernel(so,{x:a},s),i=v.runKernel(so,{x:i},s),e&&(i=be(i)),Ne(a,i)}):v.runKernel(so,n,s)}var yp=w({transpose_:v$});var Tr={};At(Tr,{assertAndGetBroadcastShape:()=>Tt,getBroadcastDims:()=>ix,getReductionAxes:()=>bp});function ix(r,t){let e=r.length,o=[];for(let n=0;n<e;n++){let s=e-1-n,a=r[s]||1;(t[t.length-1-n]||1)>1&&a===1&&o.unshift(s)}return o}function bp(r,t){let e=[];for(let o=0;o<t.length;o++){let n=r[r.length-o-1],s=t.length-o-1,a=t[s];(n==null||n===1&&a>1)&&e.unshift(s)}return e}function Tt(r,t){let e=[],o=Math.max(r.length,t.length);for(let n=0;n<o;n++){let s=r[r.length-n-1];s==null&&(s=1);let a=t[t.length-n-1];if(a==null&&(a=1),s===1)e.unshift(a);else if(a===1)e.unshift(s);else if(s!==a){let i=`Operands could not be broadcast together with shapes ${r} and ${t}.`;throw Error(i)}else e.unshift(s)}return e}function cx(r,t,e){if(Le(r),t!=null&&t.length!==3)throw new Error("tensor3d() requires shape to have three numbers");let o=we(r,e);if(o.length!==3&&o.length!==1)throw new Error("tensor3d() requires values to be number[][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor3d() requires shape to be provided when `values` are a flat array");return ye(r,t,o,e)}function k$(r,t){let e=r.shape.length,o=t.shape.length;if(e<1)throw new Error(`tf.gatherND() expects the input to be rank 1 or higher, but the rank was ${e}.`);if(o<1)throw new Error(`tf.gatherND() expects the indices to be rank 1 or higher, but the rank was ${o}.`);if(t.dtype!=="int32")throw new Error(`tf.gatherND() expects the indices to be int32 type, but the dtype was ${t.dtype}.`);if(t.shape[o-1]>e)throw new Error(`index innermost dimension length must be <= tensor rank; saw: ${t.shape[o-1]} vs. ${e}`);if(xt(r.shape)===0)throw new Error(`Requested more than 0 entries, but input is empty. Input shape: ${r.shape}.`);let n=t.shape,s=n[n.length-1],a=1;for(let u=0;u<n.length-1;++u)a*=n[u];let i=r.shape,c=n.slice();c.pop();let p=1;for(let u=s;u<e;++u)p*=i[u],c.push(i[u]);let l=[...xr(r.shape).map(u=>u/p),1].slice(0,s);return[c,a,p,l]}function px(r,t,e){let o=t.rank>1?t.shape[t.rank-1]:1,n=t.rank>1?t.rank-1:1,s=`Must have updates.shape = indices.shape[:batchDim] + shape[sliceDim:], got updates.shape: ${e.shape}, indices.shape: ${t.shape}, shape: ${r}, sliceDim: ${o}, and batchDim: ${n}.`;if(e.rank<n)throw new Error(s+` update.rank < ${n}. `);if(r.length<o+(e.rank-n))throw new Error(s+` Output shape length < ${o+(e.rank-n)}`);if(e.rank!==n+r.length-o)throw new Error(s+` update.rank != ${n+r.length-o}`);for(let a=0;a<n;++a)if(e.shape[a]!==t.shape[a])throw new Error(s+` updates.shape[${a}] (${e.shape[a]}) != indices.shape[${a}] (${t.shape[a]}).`);for(let a=0;a<e.rank-n;++a)if(e.shape[a+n]!==r[a+o])throw new Error(s+` updates.shape[${a+n}] (${e.shape[a+n]}) != shape[${a+n}] (${r[a+n]})`)}function Vf(r,t,e){if(t.rank<1)throw new Error(`tf.scatterND() expects the indices to be rank 1 or higher, but the rank was ${t.rank}.`);if(r.rank<1)throw new Error(`tf.scatterND() expects the updates to be rank 1 or higher, but the rank was ${r.rank}.`);if(t.dtype!=="int32")throw new Error(`The dtype of 'indices' should be int32, but got dtype: ${t.dtype}`);if(e.length<1)throw new Error(`Output rank must be greater or equal to 1, but got shape: ${e}`);if(e.length===0){if(t.size===0)throw new Error(`Indices specified for empty output. indices shape: ${t.shape}`);if(r.size===0)throw new Error(`Updates specified for empty output. updates shape: ${r.shape}`)}px(e,t,r)}function E$(r,t,e){let o=t.shape.length,n=o>1?t.shape[o-1]:1,s=e.length,a=1;for(let u=n;u<s;++u)a*=e[u];let i=n<1?1:n,c=xt(t.shape)/i,p=[...xr(e.slice(0,n)),1],l=xt(e);return{sliceRank:n,numUpdates:c,sliceSize:a,strides:p,outputSize:l}}var ne={};At(ne,{assertParamsValid:()=>A$,computeFlatOffset:()=>P$,computeOutShape:()=>D$,getNormalizedAxes:()=>_$,isSliceContinous:()=>O$,maskToAxes:()=>F$,parseSliceParams:()=>L$,sliceInfo:()=>B$,startForAxis:()=>xx,startIndicesWithElidedDims:()=>dx,stopForAxis:()=>yx,stopIndicesWithElidedDims:()=>hx,stridesForAxis:()=>gx,stridesWithElidedDims:()=>ux});var Mf=-2,R$=-1;function A$(r,t,e){let o=r.shape.length;E(o===t.length,()=>`Error in slice${o}D: Length of begin ${t} must match the rank of the array (${o}).`),E(o===e.length,()=>`Error in slice${o}D: Length of size ${e} must match the rank of the array (${o}).`);for(let n=0;n<o;++n)E(t[n]+e[n]<=r.shape[n],()=>`Error in slice${o}D: begin[${n}] + size[${n}] (${t[n]+e[n]}) would overflow input.shape[${n}] (${r.shape[n]})`)}function F$(r){let t=[],e=0;for(;r>0;)r&1&&t.push(e),r/=2,e++;return t}function D$(r,t,e){let o=[];for(let n=0;n<r.length;n++)o[n]=Math.ceil((t[n]-r[n])/e[n]);return o}function ux(r,t,e,o){let n=[...r];for(let s=n.length;s<o.length;s++)n.push(1);for(let s=0;s<e;s++)s===0?n[t]=1:(n.splice(t,0,1),n.pop());return n}function mx(r,t,e){return e<=r?e:e-(t-1)}function fx(r,t){let e=[];for(let o=0;o<r;o++)e.push(t+o);return e}function _$(r,t,e,o,n,s,a,i,c){let p=r.length,l=new Array(p),u=new Array(p),m=new Array(p);if(t.length&&e>0){let f=t[0],d=e+1;l=dx(a,f,d,o,r),u=hx(i,f,d,n,r),m=ux(s,f,d,r)}else for(let f=0;f<p;f++)l[f]=xx(a,o,s,r,f,c),u[f]=yx(i,n,s,r,f,c),m[f]=gx(s,f,c);return{begin:l,end:u,strides:m}}function dx(r,t,e,o,n){let s=[...n],a=fx(e,t);for(let i=0;i<s.length;i++)if(a.indexOf(i)>-1)s[i]=0;else{let c=mx(t,e,i),p=o[c];r&1<<c&&(p=0),s[i]=p}return s}function hx(r,t,e,o,n){let s=[...n],a=fx(e,t);for(let i=0;i<s.length;i++)if(a.indexOf(i)>-1)s[i]=Number.MAX_SAFE_INTEGER;else{let c=mx(t,e,i),p=o[c];r&1<<c&&(p=Number.MAX_SAFE_INTEGER),s[i]=p}for(let i=0;i<s.length;i++){let c=n[i];s[i]<0&&(s[i]+=c),s[i]=cs(0,s[i],n[i])}return s}function gx(r,t,e){let o=r[t];return(e&1<<t||o==null)&&(o=1),o}function xx(r,t,e,o,n,s){let a=t[n],i=e[n]||1;(r&1<<n||s&1<<n||a==null)&&(i>0?a=Number.MIN_SAFE_INTEGER:a=Number.MAX_SAFE_INTEGER);let c=o[n];return a<0&&(a+=c),a=cs(0,a,c-1),a}function yx(r,t,e,o,n,s){let a=t[n],i=e[n]||1;(r&1<<n||s&1<<n||a==null)&&(i>0?a=Number.MAX_SAFE_INTEGER:a=Number.MIN_SAFE_INTEGER);let c=o[n];return a<0&&(a+=c),i>0?a=cs(0,a,c):a=cs(-1,a,c-1),a}function O$(r,t,e){let o=e.length;for(let n=0;n<e.length;n++)if(e[n]>1){o=n;break}for(let n=o+1;n<e.length;n++)if(t[n]>0||e[n]!==r[n])return!1;return!0}function P$(r,t){let e=r.length>0?r[r.length-1]:1;for(let o=0;o<r.length-1;o++)e+=r[o]*t[o];return e}function L$(r,t,e){let o,n=r.shape.length;typeof t=="number"?o=[t,...new Array(n-1).fill(0)]:t.length<n?o=t.concat(new Array(n-t.length).fill(0)):o=t.slice(),o.forEach(a=>{E(a!==-1,()=>"slice() does not support negative begin indexing.")});let s;return e==null?s=new Array(n).fill(-1):typeof e=="number"?s=[e,...new Array(n-1).fill(-1)]:e.length<n?s=e.concat(new Array(n-e.length).fill(-1)):s=e,s=s.map((a,i)=>a>=0?a:(E(a===-1,()=>`Negative size values should be exactly -1 but got ${a} for the slice() size at index ${i}.`),r.shape[i]-o[i])),[o,s]}function B$(r,t,e,o,n,s,a,i,c){let p;if(o==null?(p=new Array(t.length),p.fill(1)):p=o,a!=null&&(a&a-1)!==0)throw new Error("Multiple ellipses in slice is not allowed.");let l=!1,u={dims:p.length,numAddAxisAfterEllipsis:0,begin:t.slice(),end:e.slice(),strides:p.slice(),beginMask:n,endMask:s,ellipsisMask:a,newAxisMask:i,shrinkAxisMask:c};for(let S=0;S<u.dims;S++)l&&(1<<S&i)!==0&&u.numAddAxisAfterEllipsis++,1<<S&a&&(l=!0);l||(u.ellipsisMask|=1<<u.dims,u.dims++);let m={dims:r.length,beginMask:0,endMask:0,beginValid:!1,endValid:!1};V$(u,m);let f=!0,d=!0,h=!0,g=[],x=[];for(let S=0;S<r.length;++S){if(m.strides[S]===0)throw Error(`strides[${S}] must be non-zero`);let N=!!(m.shrinkAxisMask&1<<S),k=r[S];if(k===-1){g.push(N?1:-1);continue}let $=[m.beginMask&1<<S,m.endMask&1<<S],R=[m.strides[S]>0?0:-1,m.strides[S]>0?k:k-1];if(N&&m.strides[S]<=0)throw Error("only stride 1 allowed on non-range indexing.");h=h&&m.strides[S]===1;let A=!!(m.beginMask&1<<S&&m.endMask&1<<S);if(m.beginValid&&m.endValid){if(N){let L=m.begin[S]<0?k+m.begin[S]:m.begin[S];if(m.begin[S]=L,m.end[S]=m.begin[S]+1,L<0||L>=k)throw Error(`slice index ${m.begin[S]} of dimension ${S} out of bounds.`)}else m.begin[S]=lx(m.begin[S],0,m.strides[S],k,$,R),m.end[S]=lx(m.end[S],1,m.strides[S],k,$,R);let O=m.strides[S]===1&&m.begin[S]===0&&m.end[S]===k;f=f&&O,d=d&&(S===0&&m.strides[S]===1||O)}else f=f&&m.strides[S]===1&&A,d=d&&(S===0&&m.strides[S]===1||A);let D,_=!1;if(m.beginValid&&m.endValid?(D=m.end[S]-m.begin[S],_=!0):N?(D=1,_=!0):A&&k>=0&&(m.strides[S]<0?D=-k:D=k,_=!0),_){let O;D===0||D<0!=m.strides[S]<0?O=0:O=Math.trunc(D/m.strides[S])+(D%m.strides[S]!==0?1:0),g.push(O)}else g.push(-1)}for(let S=0;S<m.finalShapeGatherIndices.length;++S){let N=m.finalShapeGatherIndices[S];N>=0?x.push(g[N]):N===Mf&&x.push(1)}return{finalShapeSparse:x.filter((S,N)=>m.finalShapeGatherIndices[N]!==Mf),finalShape:x,isIdentity:f,sliceDim0:d,isSimpleSlice:h,begin:m.begin,end:m.end,strides:m.strides}}function V$(r,t){t.beginMask=0,t.endMask=0,t.shrinkAxisMask=0;let e=0;t.beginValid=r.begin!=null,t.endValid=r.end!=null,t.begin=new Array(t.dims),t.end=new Array(t.dims),t.strides=new Array(t.dims),t.finalShapeGatherIndices=[],t.finalShapeGatherIndicesSparse=[],t.inputShapeGatherIndicesSparse=new Array(t.dims);for(let o=0;o<r.dims;o++)if(1<<o&r.ellipsisMask){let n=Math.min(t.dims-(r.dims-o)+1+r.numAddAxisAfterEllipsis,t.dims);for(;e<n;e++)t.begin[e]=0,t.end[e]=0,t.strides[e]=1,t.beginMask|=1<<e,t.endMask|=1<<e,t.finalShapeGatherIndices.push(e),t.finalShapeGatherIndicesSparse.push(-1),t.inputShapeGatherIndicesSparse[e]=o}else if(1<<o&r.newAxisMask)t.finalShapeGatherIndices.push(Mf),t.finalShapeGatherIndicesSparse.push(-1);else{if(e===t.begin.length)throw Error(`Index out of range using input dim ${e}; input has only ${t.dims} dims, ${t.begin.length}.`);r.begin!=null&&(t.begin[e]=r.begin[o]),r.end!=null&&(t.end[e]=r.end[o]),t.strides[e]=r.strides[o],r.beginMask&1<<o&&(t.beginMask|=1<<e),r.endMask&1<<o&&(t.endMask|=1<<e),r.shrinkAxisMask&1<<o?(t.finalShapeGatherIndices.push(R$),t.finalShapeGatherIndicesSparse.push(-1),t.shrinkAxisMask|=1<<e):(t.finalShapeGatherIndices.push(e),t.finalShapeGatherIndicesSparse.push(o)),t.inputShapeGatherIndicesSparse[e]=o,e++}}function lx(r,t,e,o,n,s){if(n[t])return e>0?s[t]:s[t+1&1];{let a=r<0?o+r:r;return a<s[0]?s[0]:a>s[1]?s[1]:a}}function M$(r,t){let e=T(r,"a","add"),o=T(t,"b","add");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel("Add",n)}var Et=w({add_:M$});function z$(r,t){let e=T(r,"a","floorDiv"),o=T(t,"b","floorDiv");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel(Ho,n)}var Cp=w({floorDiv_:z$});function W$(r,t){let e=T(r,"a","div"),o=T(t,"b","div");if([e,o]=ft(e,o),e.dtype==="int32"&&o.dtype==="int32")return Cp(e,o);let n={a:e,b:o},s={};return v.runKernel(zo,n,s)}var Ut=w({div_:W$});function G$(r,t){let e=T(r,"a","mul"),o=T(t,"b","mul");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel(sn,n)}var at=w({mul_:G$});function U$(r){let t=T(r,"x","abs");if(t.dtype==="complex64"){let e={x:t};return v.runKernel(ws,e)}else{let e={x:t};return v.runKernel("Abs",e)}}var fe=w({abs_:U$});function H$(r){let e={x:T(r,"x","acos")};return v.runKernel(Ao,e)}var bx=w({acos_:H$});function K$(r){let e={x:T(r,"x","acosh")};return v.runKernel(Fo,e)}var Cx=w({acosh_:K$});function q$(r){E(Array.isArray(r),()=>"The argument passed to tf.addN() must be a list of tensors"),E(r.length>=1,()=>`Must pass at least one tensor to tf.addN(), but got ${r.length}`);let t=r.map((n,s)=>T(n,`tensors${s}`,"addN")),e=t[0];t.forEach(n=>{if(n.dtype!==e.dtype)throw new Error("All tensors passed to tf.addN() must have the same dtype")}),t.forEach(n=>{if(!He(n.shape,e.shape))throw new Error("All tensors passed to tf.addN() must have the same shape")});let o=t;return v.runKernel(fs,o)}var Tx=w({addN_:q$});function X$(r,t=null,e=!1){let n={x:T(r,"x","all","bool")},s={axis:t,keepDims:e};return v.runKernel("All",n,s)}var Sx=w({all_:X$});function j$(r,t=null,e=!1){let n={x:T(r,"x","any","bool")},s={axis:t,keepDims:e};return v.runKernel("Any",n,s)}var wx=w({any_:j$});function Y$(r,t=0){let o={x:T(r,"x","argMax")},n={axis:t};return v.runKernel(ds,o,n)}var Nx=w({argMax_:Y$});function Z$(r,t=0){let o={x:T(r,"x","argMin")},n={axis:t};return v.runKernel(hs,o,n)}var Ix=w({argMin_:Z$});function Q$(r){let e={x:T(r,"x","asin")};return v.runKernel(Do,e)}var vx=w({asin_:Q$});function J$(r){let e={x:T(r,"x","asinh")};return v.runKernel(_o,e)}var kx=w({asinh_:J$});function t2(r){let e={x:T(r,"x","atan")};return v.runKernel(Oo,e)}var Ex=w({atan_:t2});function e2(r,t){let e=T(r,"a","atan2"),o=T(t,"b","atan2");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel(Lo,n)}var $x=w({atan2_:e2});function r2(r){let e={x:T(r,"x","atanh")};return v.runKernel(Po,e)}var Rx=w({atanh_:r2});function o2(r,t,e,o,n="NHWC",s){let a=r[3],i=[...t,a],c=Fx(n);return Pn(r,i,e,s,o,null,null,c)}function Wf(r,t,e,o,n,s,a="channelsLast"){let[i,c]=wp(t),p;if(a==="channelsLast")p=[i,c,r[3],r[3]];else if(a==="channelsFirst")p=[i,c,r[1],r[1]];else throw new Error(`Unknown dataFormat ${a}`);return Pn(r,p,e,o,n,s,!1,a)}function n2(r,t,e,o,n,s,a="NDHWC"){let[i,c,p]=zf(t),l,u;if(a==="NDHWC")u="channelsLast",l=[i,c,p,r[4],r[4]];else if(a==="NCDHW")u="channelsFirst",l=[i,c,p,r[1],r[1]];else throw new Error(`Unknown dataFormat ${a}`);return Ax(r,l,e,o,n,!1,u,s)}function Pn(r,t,e,o,n,s,a=!1,i="channelsLast"){let[c,p,l,u]=[-1,-1,-1,-1];if(i==="channelsLast")[c,p,l,u]=r;else if(i==="channelsFirst")[c,u,p,l]=r;else throw new Error(`Unknown dataFormat ${i}`);let[m,f,,d]=t,[h,g]=wp(e),[x,b]=wp(o),S=ti(m,x),N=ti(f,b),{padInfo:k,outHeight:$,outWidth:R}=i2(n,p,l,h,g,S,N,s,i),A=a?d*u:d,D;return i==="channelsFirst"?D=[c,A,$,R]:i==="channelsLast"&&(D=[c,$,R,A]),{batchSize:c,dataFormat:i,inHeight:p,inWidth:l,inChannels:u,outHeight:$,outWidth:R,outChannels:A,padInfo:k,strideHeight:h,strideWidth:g,filterHeight:m,filterWidth:f,effectiveFilterHeight:S,effectiveFilterWidth:N,dilationHeight:x,dilationWidth:b,inShape:r,outShape:D,filterShape:t}}function Ax(r,t,e,o,n,s=!1,a="channelsLast",i){let[c,p,l,u,m]=[-1,-1,-1,-1,-1];if(a==="channelsLast")[c,p,l,u,m]=r;else if(a==="channelsFirst")[c,m,p,l,u]=r;else throw new Error(`Unknown dataFormat ${a}`);let[f,d,h,,g]=t,[x,b,S]=zf(e),[N,k,$]=zf(o),R=ti(f,N),A=ti(d,k),D=ti(h,$),{padInfo:_,outDepth:O,outHeight:L,outWidth:B}=c2(n,p,l,u,x,b,S,R,A,D,i),M=s?g*m:g,V;return a==="channelsFirst"?V=[c,M,O,L,B]:a==="channelsLast"&&(V=[c,O,L,B,M]),{batchSize:c,dataFormat:a,inDepth:p,inHeight:l,inWidth:u,inChannels:m,outDepth:O,outHeight:L,outWidth:B,outChannels:M,padInfo:_,strideDepth:x,strideHeight:b,strideWidth:S,filterDepth:f,filterHeight:d,filterWidth:h,effectiveFilterDepth:R,effectiveFilterHeight:A,effectiveFilterWidth:D,dilationDepth:N,dilationHeight:k,dilationWidth:$,inShape:r,outShape:V,filterShape:t}}function s2(r,t,e,o,n){o==null&&(o=Gf(r,t,e));let s=r[0],a=r[1],i=_n((s-t+2*o)/e+1,n),c=_n((a-t+2*o)/e+1,n);return[i,c]}function a2(r,t,e,o,n,s){n==null&&(n=Gf(r,t,o));let a=r[0],i=r[1],c=r[2],p=_n((a-t+2*n)/o+1,s),l=_n((i-t+2*n)/o+1,s),u=_n((c-t+2*n)/o+1,s);return[p,l,u,e]}function Gf(r,t,e,o=1){let n=ti(t,o);return Math.floor((r[0]*(e-1)-e+n)/2)}function wp(r){return typeof r=="number"?[r,r,r]:r.length===2?[r[0],r[1],1]:r}function zf(r){return typeof r=="number"?[r,r,r]:r}function ti(r,t){return t<=1?r:r+(r-1)*(t-1)}function i2(r,t,e,o,n,s,a,i,c){let p,l,u;if(typeof r=="number"){p={top:r,bottom:r,left:r,right:r,type:r===0?"VALID":"NUMBER"};let f=s2([t,e],s,o,r,i);l=f[0],u=f[1]}else if(r==="same"){l=Math.ceil(t/o),u=Math.ceil(e/n);let m=Math.max(0,(l-1)*o+s-t),f=Math.max(0,(u-1)*n+a-e),d=Math.floor(m/2),h=m-d,g=Math.floor(f/2),x=f-g;p={top:d,bottom:h,left:g,right:x,type:"SAME"}}else if(r==="valid")p={top:0,bottom:0,left:0,right:0,type:"VALID"},l=Math.ceil((t-s+1)/o),u=Math.ceil((e-a+1)/n);else if(typeof r=="object"){let m=c==="channelsLast"?r[1][0]:r[2][0],f=c==="channelsLast"?r[1][1]:r[2][1],d=c==="channelsLast"?r[2][0]:r[3][0],h=c==="channelsLast"?r[2][1]:r[3][1];p={top:m,bottom:f,left:d,right:h,type:m===0&&f===0&&d===0&&h===0?"VALID":"EXPLICIT"},l=_n((t-s+m+f)/o+1,i),u=_n((e-a+d+h)/n+1,i)}else throw Error(`Unknown padding parameter: ${r}`);return{padInfo:p,outHeight:l,outWidth:u}}function c2(r,t,e,o,n,s,a,i,c,p,l){let u,m,f,d;if(typeof r=="number"){u={top:r,bottom:r,left:r,right:r,front:r,back:r,type:r===0?"VALID":"NUMBER"};let g=a2([t,e,o,1],i,1,n,r,l);m=g[0],f=g[1],d=g[2]}else if(r==="same"){m=Math.ceil(t/n),f=Math.ceil(e/s),d=Math.ceil(o/a);let h=(m-1)*n+i-t,g=(f-1)*s+c-e,x=(d-1)*a+p-o,b=Math.floor(h/2),S=h-b,N=Math.floor(g/2),k=g-N,$=Math.floor(x/2),R=x-$;u={top:N,bottom:k,left:$,right:R,front:b,back:S,type:"SAME"}}else if(r==="valid")u={top:0,bottom:0,left:0,right:0,front:0,back:0,type:"VALID"},m=Math.ceil((t-i+1)/n),f=Math.ceil((e-c+1)/s),d=Math.ceil((o-p+1)/a);else throw Error(`Unknown padding parameter: ${r}`);return{padInfo:u,outDepth:m,outHeight:f,outWidth:d}}function _n(r,t){if(!t)return Math.trunc(r);switch(t){case"round":return Math.round(r);case"ceil":return Math.ceil(r);case"floor":return Math.floor(r);default:throw new Error(`Unknown roundingMode ${t}`)}}function On(r){let[t,e,o]=wp(r);return t===1&&e===1&&o===1}function de(r,t){return On(r)||On(t)}function Fx(r){if(r==="NHWC")return"channelsLast";if(r==="NCHW")return"channelsFirst";throw new Error(`Unknown dataFormat ${r}`)}function Zt(r,t,e){if(e!=null){if(typeof t=="string")throw Error(`Error in ${r}: pad must be an integer when using dimRoundingMode ${e} but got pad ${t}.`);if(typeof t=="number")E(Pr(t),()=>`Error in ${r}: pad must be an integer when using dimRoundingMode ${e} but got pad ${t}.`);else if(typeof t=="object")t.forEach(o=>{o.forEach(n=>{E(Pr(n),()=>`Error in ${r}: pad must be an integer when using dimRoundingMode ${e} but got pad ${n}.`)})});else throw Error(`Error in ${r}: Unknown padding parameter: ${t}`)}}function p2(r,t){let o={x:T(r,"x","reshape","string_or_numeric")},n={shape:t};return v.runKernel(ga,o,n)}var P=w({reshape_:p2});function l2(r,t,e,o,n){let s=T(r,"x","avgPool","float32"),a=1;E(de(e,a),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${e} and dilations '${a}'`);let i=s,c=!1;s.rank===3&&(c=!0,i=P(s,[1,s.shape[0],s.shape[1],s.shape[2]])),E(i.rank===4,()=>`Error in avgPool: x must be rank 4 but got rank ${i.rank}.`),Zt("avgPool",o,n);let p={x:i},l={filterSize:t,strides:e,pad:o,dimRoundingMode:n},u=v.runKernel(gs,p,l);return u=kt(u,s.dtype),c?P(u,[u.shape[1],u.shape[2],u.shape[3]]):u}var Np=w({avgPool_:l2});function u2(r,t,e,o,n,s="NDHWC"){let a=T(r,"x","avgPool3d","float32"),i=a,c=!1;a.rank===4&&(c=!0,i=P(a,[1,a.shape[0],a.shape[1],a.shape[2],a.shape[3]])),E(i.rank===5,()=>`Error in avgPool3d: x must be rank 5 but got rank ${i.rank}.`),E(s==="NDHWC",()=>`Error in avgPool3d: Only NDHWC is currently supported, but got dataFormat of ${s}`),Zt("avgPool3d",o,n);let p={x:i},l={filterSize:t,strides:e,pad:o,dimRoundingMode:n,dataFormat:s},u=v.runKernel(xs,p,l);return u=kt(u,i.dtype),c?P(u,[u.shape[1],u.shape[2],u.shape[3],u.shape[4]]):u}var Dx=w({avgPool3d_:u2});function m2(r,t=0){E(r.length>=1,()=>"Pass at least one tensor to concat");let e=Fn(r,"tensors","concat","string_or_numeric");if(e[0].dtype==="complex64"&&e.forEach(s=>{if(s.dtype!=="complex64")throw new Error(`Cannot concatenate complex64 tensors with a tensor
          with dtype ${s.dtype}. `)}),e.length===1)return Ae(e[0]);let o=e,n={axis:t};return v.runKernel(Ns,o,n)}var Dt=w({concat_:m2});function f2(r){let e={x:T(r,"x","sigmoid","float32")};return v.runKernel(gn,e)}var wr=w({sigmoid_:f2});function d2(r,t,e){let o=T(r,"x","slice","string_or_numeric");if(o.rank===0)throw new Error("Slicing scalar is not possible");let n={x:o},s={begin:t,size:e};return v.runKernel(wa,n,s)}var yt=w({slice_:d2});function h2(r){let e={x:T(r,"x","tanh","float32")};return v.runKernel(Cn,e)}var Zi=w({tanh_:h2});function g2(r,t,e,o,n,s){let a=T(r,"forgetBias","basicLSTMCell"),i=T(t,"lstmKernel","basicLSTMCell"),c=T(e,"lstmBias","basicLSTMCell"),p=T(o,"data","basicLSTMCell"),l=T(n,"c","basicLSTMCell"),u=T(s,"h","basicLSTMCell"),m=Dt([p,u],1),f=St(m,i),d=Et(f,c),h=d.shape[0],g=d.shape[1]/4,x=[h,g],b=yt(d,[0,0],x),S=yt(d,[0,g],x),N=yt(d,[0,g*2],x),k=yt(d,[0,g*3],x),$=Et(at(wr(b),Zi(S)),at(l,wr(Et(a,N)))),R=at(Zi($),wr(k));return[$,R]}var _x=w({basicLSTMCell_:g2});function x2(r,t,e){let o=T(r,"x","batchToSpaceND"),n=t.reduce((i,c)=>i*c);E(o.rank>=1+t.length,()=>`input rank is ${o.rank} but should be > than blockShape.length ${t.length}`),E(e.length===t.length,()=>`crops.length is ${e.length} but should be equal to blockShape.length  ${t.length}`),E(o.shape[0]%n===0,()=>`input tensor batch is ${o.shape[0]} but is not divisible by the product of the elements of blockShape ${t.join(" * ")} === ${n}`);let s={x:o},a={blockShape:t,crops:e};return v.runKernel(bs,s,a)}var Ip=w({batchToSpaceND_:x2});function Ox(r){let t;return r.rank===0||r.rank===1?t=P(r,[1,1,1,r.size]):r.rank===2?t=P(r,[1,1,r.shape[0],r.shape[1]]):r.rank===3?t=P(r,[1,r.shape[0],r.shape[1],r.shape[2]]):t=r,t}function y2(r,t,e,o,n,s){s==null&&(s=.001);let a=T(r,"x","batchNorm"),i=T(t,"mean","batchNorm"),c=T(e,"variance","batchNorm"),p;n!=null&&(p=T(n,"scale","batchNorm"));let l;o!=null&&(l=T(o,"offset","batchNorm")),E(i.rank===c.rank,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),E(l==null||i.rank===l.rank,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),E(p==null||i.rank===p.rank,()=>"Batch normalization gradient requires mean and scale to have equal ranks.");let m={x:Ox(a),scale:p,offset:l,mean:i,variance:c},f={varianceEpsilon:s},d=v.runKernel(Us,m,f);return P(d,a.shape)}var uo=w({batchNorm_:y2});function b2(r,t,e,o,n,s){let a=T(r,"x","batchNorm"),i=T(t,"mean","batchNorm"),c=T(e,"variance","batchNorm"),p;n!=null&&(p=T(n,"scale","batchNorm"));let l;return o!=null&&(l=T(o,"offset","batchNorm")),E(a.rank===2,()=>`Error in batchNorm2D: x must be rank 2 but got rank ${a.rank}.`),E(i.rank===2||i.rank===1,()=>`Error in batchNorm2D: mean must be rank 2 or rank 1 but got rank ${i.rank}.`),E(c.rank===2||c.rank===1,()=>`Error in batchNorm2D: variance must be rank 2 or rank 1 but got rank ${c.rank}.`),p!=null&&E(p.rank===2||p.rank===1,()=>`Error in batchNorm2D: scale must be rank 2 or rank 1 but got rank ${p.rank}.`),l!=null&&E(l.rank===2||l.rank===1,()=>`Error in batchNorm2D: offset must be rank 2 or rank 1 but got rank ${l.rank}.`),uo(a,i,c,l,p,s)}var Px=w({batchNorm2d_:b2});function C2(r,t,e,o,n,s){let a=T(r,"x","batchNorm"),i=T(t,"mean","batchNorm"),c=T(e,"variance","batchNorm"),p;n!=null&&(p=T(n,"scale","batchNorm"));let l;return o!=null&&(l=T(o,"offset","batchNorm")),E(a.rank===3,()=>`Error in batchNorm3D: x must be rank 3 but got rank ${a.rank}.`),E(i.rank===3||i.rank===1,()=>`Error in batchNorm3D: mean must be rank 3 or rank 1 but got rank ${i.rank}.`),E(c.rank===3||c.rank===1,()=>`Error in batchNorm3D: variance must be rank 3 or rank 1 but got rank ${c.rank}.`),p!=null&&E(p.rank===3||p.rank===1,()=>`Error in batchNorm3D: scale must be rank 3 or rank 1 but got rank ${p.rank}.`),l!=null&&E(l.rank===3||l.rank===1,()=>`Error in batchNorm3D: offset must be rank 3 or rank 1 but got rank ${l.rank}.`),uo(a,i,c,l,p,s)}var Lx=w({batchNorm3d_:C2});function T2(r,t,e,o,n,s){let a=T(r,"x","batchNorm"),i=T(t,"mean","batchNorm"),c=T(e,"variance","batchNorm"),p;n!=null&&(p=T(n,"scale","batchNorm"));let l;return o!=null&&(l=T(o,"offset","batchNorm")),E(a.rank===4,()=>`Error in batchNorm4D: x must be rank 4 but got rank ${a.rank}.`),E(i.rank===4||i.rank===1,()=>`Error in batchNorm4D: mean must be rank 4 or rank 1 but got rank ${i.rank}.`),E(c.rank===4||c.rank===1,()=>`Error in batchNorm4D: variance must be rank 4 or rank 1 but got rank ${c.rank}.`),p!=null&&E(p.rank===4||p.rank===1,()=>`Error in batchNorm4D: scale must be rank 4 or rank 1 but got rank ${p.rank}.`),l!=null&&E(l.rank===4||l.rank===1,()=>`Error in batchNorm4D: offset must be rank 4 or rank 1 but got rank ${l.rank}.`),uo(a,i,c,l,p,s)}var Bx=w({batchNorm4d_:T2});function S2(r,t,e){let o=T(r,"x","bincount"),n=T(t,"weights","bincount");E(o.dtype==="int32",()=>`Error in bincount: input dtype must be int32, but got ${o.dtype}`),E(e>=0,()=>`size must be non-negative, but got ${e}.`),E(n.size===o.size||n.size===0,()=>`Error in bincount: weights must have the same size as input or0-length, but got input shape: ${o.shape}, weights shape: ${n.shape}.`);let s={x:o,weights:n},a={size:e};return v.runKernel(Cs,s,a)}var vp=w({bincount_:S2});function w2(r,t){let e=T(r,"s0","broadcastArgs","int32"),o=T(t,"s1","broadcastArgs","int32");if(e.rank!==1)throw new Error(`broadcastArgs(): first input must be a vector (rank=1). Has rank ${e.rank}`);if(o.rank!==1)throw new Error(`broadcastArgs(): second input must be a vector (rank=1). Has rank ${o.rank}`);let n={s0:e,s1:o};return v.runKernel(Ts,n)}var Vx=w({broadcastArgs_:w2});function N2(r,t){let e=T(r,"broadcastTo","x"),o=e.shape;if(t.some(p=>!(p>0)||p%1!==0))throw new Error(`broadcastTo(): Invalid broadcast shape [${t}].`);if(t.length<e.rank)throw new Error(`broadcastTo(): shape.length=${t.length} < input.rank=${e.rank}.`);if(t.length>e.rank){let p=e.shape.slice();for(;p.length<t.length;)p.unshift(1);e=P(e,p)}let n=e.shape,s=Array.from(t);for(let p=t.length-1;p>=0;p--)if(n[p]===t[p])s[p]=1;else if(e.shape[p]!==1)throw new Error(`broadcastTo(): [${o}] cannot be broadcast to [${t}].`);if(s.map((p,l)=>p>1?l:-1).filter(p=>p>=0).length===0)return Ae(e);let i={x:e},c={reps:s};return v.runKernel(no,i,c)}var mo=w({broadcastTo_:N2});function I2(r){let e={x:T(r,"x","ceil","float32")};return v.runKernel(Bo,e)}var Mx=w({ceil_:I2});function fo(r,t,e){let o={shape:r,value:t,dtype:e};return v.runKernel(Ws,{},o)}function v2(r,t,e){let o=T(r,"x","clipByValue");if(E(t<=e,()=>`Error in clip: min (${t}) must be less than or equal to max (${e}).`),t===e)return fo(o.shape,t,o.dtype);let n={x:o},s={clipValueMin:t,clipValueMax:e};return v.runKernel(Vo,n,s)}var zx=w({clipByValue_:v2});function k2(r){return Dt(r,0)}var Wx=w({concat1d_:k2});function E2(r,t){return Dt(r,t)}var Gx=w({concat2d_:E2});function $2(r,t){return Dt(r,t)}var Ux=w({concat3d_:$2});function R2(r,t){return Dt(r,t)}var Hx=w({concat4d_:R2});function A2(r,t,e,o,n="NHWC",s=[1,1],a){let i=T(r,"x","conv2d","float32"),c=T(t,"filter","conv2d","float32"),p=i,l=!1;i.rank===3&&(l=!0,p=P(i,[1,i.shape[0],i.shape[1],i.shape[2]])),E(p.rank===4,()=>`Error in conv2d: input must be rank 4, but got rank ${p.rank}.`),E(c.rank===4,()=>`Error in conv2d: filter must be rank 4, but got rank ${c.rank}.`),Zt("conv2d",o,a);let u=n==="NHWC"?p.shape[3]:p.shape[1];E(u===c.shape[2],()=>`Error in conv2d: depth of input (${u}) must match input depth for filter ${c.shape[2]}.`),E(de(e,s),()=>`Error in conv2D: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`);let m={x:p,filter:c},f={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a},d=v.runKernel(Is,m,f);return l?P(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var ho=w({conv2d_:A2});function F2(r,t,e,o,n="NWC",s=1,a){let i=T(r,"x","conv1d"),c=T(t,"filter","conv1d"),p=i,l=!1;i.rank===2&&(l=!0,p=P(i,[1,i.shape[0],i.shape[1]])),E(p.rank===3,()=>`Error in conv1d: input must be rank 3, but got rank ${p.rank}.`),E(c.rank===3,()=>`Error in conv1d: filter must be rank 3, but got rank ${c.rank}.`),Zt("conv1d",o,a),E(p.shape[2]===c.shape[1],()=>`Error in conv1d: depth of input (${p.shape[2]}) must match input depth for filter ${c.shape[1]}.`),E(de(e,s),()=>`Error in conv1D: Either stride or dilation must be 1. Got stride ${e} and dilation '${s}'`),E(n==="NWC",()=>`Error in conv1d: got dataFormat of ${n} but only NWC is currently supported.`);let u=P(c,[1,c.shape[0],c.shape[1],c.shape[2]]),m=P(p,[p.shape[0],1,p.shape[1],p.shape[2]]),g=ho(m,u,[1,e],o,"NHWC",[1,s],a);return l?P(g,[g.shape[2],g.shape[3]]):P(g,[g.shape[0],g.shape[2],g.shape[3]])}var Kx=w({conv1d_:F2});function D2(r,t,e,o,n,s="NHWC",a){E(r.length===t.rank,()=>`Length of inShape (${r.length}) and rank of dy (${t.rank}) must match`);let i=r,c=t,p=!1;t.rank===3&&(p=!0,c=P(t,[1,t.shape[0],t.shape[1],t.shape[2]]),i=[1,r[0],r[1],r[2]]),E(i.length===4,()=>`Error in conv2dDerInput: inShape must be length 4, but got length ${i.length}.`),E(c.rank===4,()=>`Error in conv2dDerInput: dy must be rank 4, but got rank ${c.rank}`),E(e.rank===4,()=>`Error in conv2dDerInput: filter must be rank 4, but got rank ${e.rank}`);let l=s==="NHWC"?i[3]:i[1],u=s==="NHWC"?c.shape[3]:c.shape[1];E(l===e.shape[2],()=>`Error in conv2dDerInput: depth of input (${l}) must match input depth for filter ${e.shape[2]}.`),E(u===e.shape[3],()=>`Error in conv2dDerInput: depth of output (${u}) must match output depth for filter ${e.shape[3]}.`),Zt("conv2dDerInput",n,a);let m={dy:c,filter:e},f={strides:o,pad:n,dataFormat:s,dimRoundingMode:a,inputShape:i},d=v.runKernel(ks,m,f);return p?P(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var kp=w({conv2DBackpropInput_:D2});function _2(r,t,e,o,n,s){let a=T(r,"x","conv2dTranspose"),i=T(t,"filter","conv2dTranspose");return kp(e,a,i,o,n,"NHWC",s)}var qx=w({conv2dTranspose_:_2});function O2(r,t,e,o,n="NDHWC",s=[1,1,1]){let a=T(r,"x","conv3d"),i=T(t,"filter","conv3d"),c=a,p=!1;a.rank===4&&(p=!0,c=P(a,[1,a.shape[0],a.shape[1],a.shape[2],a.shape[3]])),E(c.rank===5,()=>`Error in conv3d: input must be rank 5, but got rank ${c.rank}.`),E(i.rank===5,()=>`Error in conv3d: filter must be rank 5, but got rank ${i.rank}.`),E(c.shape[4]===i.shape[3],()=>`Error in conv3d: depth of input (${c.shape[4]}) must match input depth for filter ${i.shape[3]}.`),E(de(e,s),()=>`Error in conv3D: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`),E(n==="NDHWC",()=>`Error in conv3d: got dataFormat of ${n} but only NDHWC is currently supported.`);let l={x:c,filter:i},u={strides:e,pad:o,dataFormat:n,dilations:s},m=v.runKernel(Es,l,u);return p?P(m,[m.shape[1],m.shape[2],m.shape[3],m.shape[4]]):m}var Xx=w({conv3d_:O2});function P2(r,t,e,o,n){E(r.length===t.rank,()=>`Length of inShape (${r.length}) and rank of dy (${t.rank}) must match`);let s=r,a=t,i=!1;t.rank===4&&(i=!0,a=P(t,[1,t.shape[0],t.shape[1],t.shape[2],t.shape[3]]),s=[1,r[0],r[1],r[2],r[3]]);let c=s[4],p=a.shape[4];E(s.length===5,()=>`Error in conv3dDerInput: inShape must be length 5, but got length ${s.length}.`),E(a.rank===5,()=>`Error in conv3dDerInput: dy must be rank 5, but got rank ${a.rank}`),E(e.rank===5,()=>`Error in conv3dDerInput: filter must be rank 5, but got rank ${e.rank}`),E(c===e.shape[3],()=>`Error in conv3dDerInput: depth of input (${c}) must match input depth for filter ${e.shape[3]}.`),E(p===e.shape[4],()=>`Error in conv3dDerInput: depth of output (${p}) must match output depth for filter ${e.shape[4]}.`);let l={dy:a,filter:e},u={pad:n,strides:o,inputShape:s},m=v.runKernel($s,l,u);return i?P(m,[m.shape[1],m.shape[2],m.shape[3],m.shape[4]]):m}var jx=w({conv3DBackpropInput_:P2});function L2(r,t,e,o,n){let s=T(r,"x","conv3dTranspose"),a=T(t,"filter","conv3dTranspose");return jx(e,s,a,o,n)}var Yx=w({conv3dTranspose_:L2});function B2(r){let e={x:T(r,"x","cos","float32")};return v.runKernel("Cos",e)}var Zx=w({cos_:B2});function V2(r){let e={x:T(r,"x","cosh","float32")};return v.runKernel(Mo,e)}var Qx=w({cosh_:V2});function M2(r,t=0,e=!1,o=!1){let s={x:T(r,"x","cumprod")},a={axis:t,exclusive:e,reverse:o};return v.runKernel(Rs,s,a)}var Jx=w({cumprod_:M2});function z2(r,t=0,e=!1,o=!1){let s={x:T(r,"x","cumsum")},a={axis:t,exclusive:e,reverse:o};return v.runKernel(As,s,a)}var ty=w({cumsum_:z2});function W2(r,t,e,o=!1){let n=T(r,"x","denseBincount"),s=T(t,"weights","denseBincount");E(n.dtype==="int32",()=>`Error in denseBincount: input dtype must be int32, but got ${n.dtype}`),E(n.rank<=2,()=>`Error in denseBincount: input must be at most rank 2, but got rank ${n.rank}.`),E(e>=0,()=>`size must be non-negative, but got ${e}.`),E(s.size===n.size||s.size===0,()=>`Error in denseBincount: weights must have the same shape as x or 0-length, but got x shape: ${n.shape}, weights shape: ${s.shape}.`);let a={x:n,weights:s},i={size:e,binaryOutput:o};return v.runKernel(Ds,a,i)}var ey=w({denseBincount_:W2});function G2(r,t,e="NHWC"){let o=T(r,"x","depthToSpace","float32"),n=e==="NHWC"?o.shape[1]:o.shape[2],s=e==="NHWC"?o.shape[2]:o.shape[3],a=e==="NHWC"?o.shape[3]:o.shape[1];E(t>1,()=>`blockSize should be > 1 for depthToSpace, but was: ${t}`),E(n*t>=0,()=>`Negative dimension size caused by overflow when multiplying
    ${n} and ${t}  for depthToSpace with input shape
    ${o.shape}`),E(s*t>=0,()=>`Negative dimension size caused by overflow when multiplying
    ${s} and ${t} for depthToSpace with input shape
        ${o.shape}`),E(a%(t*t)===0,()=>`Dimension size must be evenly divisible by ${t*t} but is ${a} for depthToSpace with input shape ${o.shape}`);let i={x:o},c={blockSize:t,dataFormat:e};return v.runKernel(_s,i,c)}var ry=w({depthToSpace_:G2});function U2(r,t,e,o,n="NHWC",s=[1,1],a){let i=T(r,"x","depthwiseConv2d","float32"),c=T(t,"filter","depthwiseConv2d","float32"),p=i,l=!1;i.rank===3&&(l=!0,p=P(i,[1,i.shape[0],i.shape[1],i.shape[2]])),E(p.rank===4,()=>`Error in depthwiseConv2d: input must be rank 4, but got rank ${p.rank}.`),E(c.rank===4,()=>`Error in depthwiseConv2d: filter must be rank 4, but got rank ${c.rank}.`);let u=n==="NHWC"?p.shape[3]:p.shape[1];E(u===c.shape[2],()=>`Error in depthwiseConv2d: number of input channels (${u}) must match the inChannels dimension in filter ${c.shape[2]}.`),Zt("depthwiseConv2d",o,a);let m={x:p,filter:c},f={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a},d=v.runKernel(Os,m,f);return l?P(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var ei=w({depthwiseConv2d_:U2});function H2(r){let e={x:T(r,"x","diag")};return v.runKernel(Bs,e)}var oy=w({diag_:H2});function K2(r,t,e,o,n=[1,1],s="NHWC"){let a=T(r,"x","dilation2d"),i=T(t,"filter","dilation2d");E(a.rank===3||a.rank===4,()=>`Error in dilation2d: input must be rank 3 or 4, but got rank ${a.rank}.`),E(i.rank===3,()=>`Error in dilation2d: filter must be rank 3, but got rank ${i.rank}.`),E(s==="NHWC",()=>`Error in dilation2d: Only NHWC is currently supported, but got dataFormat of ${s}`);let c=a,p=!1;a.rank===3&&(c=P(a,[1,a.shape[0],a.shape[1],a.shape[2]]),p=!0);let l={x:c,filter:i},u={strides:e,pad:o,dilations:n},m=v.runKernel(Vs,l,u);return p?P(m,[m.shape[1],m.shape[2],m.shape[3]]):m}var ny=w({dilation2d_:K2});function q2(r,t){let e=T(r,"a","equal","string_or_numeric"),o=T(t,"b","equal","string_or_numeric");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(Wo,n)}var Ep=w({equal_:q2});function X2(r,t,e){let o=T(t,"a","where"),n=T(e,"b","where"),s=T(r,"condition","where","bool"),a=Tt(Tt(s.shape,o.shape),n.shape),i=mo(s,a),c=mo(o,a),p=mo(n,a),l={condition:i,t:c,e:p};return v.runKernel(Sa,l)}var mr=w({where_:X2});function j2(r){let e={x:T(r,"x","zerosLike")};return v.runKernel(za,e)}var ri=w({zerosLike_:j2});function Y2(r,t){let e=T(r,"a","div"),o=T(t,"b","div");[e,o]=ft(e,o);let n=Ut(e,o),s=ri(n),a=Ep(o,s);return mr(a,s,n)}var sy=w({divNoNan_:Y2});function Z2(r,t){let e=T(r,"t1","dot"),o=T(t,"t2","dot");E((e.rank===1||e.rank===2)&&(o.rank===1||o.rank===2),()=>`Error in dot: inputs must all be rank 1 or 2, but got ranks ${e.rank} and ${o.rank}.`);let n=e.rank===1?e.size:e.shape[1],s=o.rank===1?o.size:o.shape[0];if(E(n===s,()=>`Error in dot: inner dimensions of inputs must match, but got ${n} and ${s}.`),e.rank===1&&o.rank===1){let a=P(e,[1,-1]),i=P(o,[-1,1]),c=St(a,i);return P(c,[])}else if(e.rank===1&&o.rank===2){let a=P(e,[1,-1]),i=P(o,[o.shape[0],o.shape[1]]),c=St(a,i);return P(c,[c.size])}else if(e.rank===2&&o.rank===1){let a=P(o,[-1,1]),i=St(e,a);return P(i,[i.size])}else{let a=P(o,[o.shape[0],o.shape[1]]);return St(e,a)}}var ay=w({dot_:Z2});function Q2(r,...t){let e=t.map((n,s)=>T(n,`tensors${s}`,"einsum")),o={equation:r};return v.runKernel(Ms,e,o)}var iy=w({einsum_:Q2});function J2(r){let e={x:T(r,"x","elu","float32")};return v.runKernel("Elu",e)}var $p=w({elu_:J2});function tR(r){let t=T(r,"x","erf");E(t.dtype==="int32"||t.dtype==="float32",()=>"Input dtype must be `int32` or `float32`."),t.dtype==="int32"&&(t=kt(t,"float32"));let e={x:t};return v.runKernel("Erf",e)}var cy=w({erf_:tR});function Uf(r,t){for(let e=0;e<r.length;++e)if(r[r.length-e-1]!==t-1-e)return!1;return!0}function py(r,t,e){let o=r.length+t.length,n=[],s=0,a=0;for(let i=0;i<o;i++)e.indexOf(i)===-1?n.push(r[s++]):n.push(t[a++]);return n}function eR(r,t){let e=[],o=r.length;for(let s=0;s<o;s++)t.indexOf(s)===-1&&e.push(r[s]);let n=t.map(s=>r[s]);return[e,n]}function Mr(r,t){let e=t.map(o=>1);return py(r,e,t)}function rR(r,t,e){E(Uf(t,e),()=>`${r} supports only inner-most axes for now. Got axes ${t} and rank-${e} input.`)}function oR(r,t){if(Uf(r,t))return null;let e=[];for(let o=0;o<t;++o)r.indexOf(o)===-1&&e.push(o);return r.forEach(o=>e.push(o)),e}function nR(r){return r.map((t,e)=>[e,t]).sort((t,e)=>t[1]-e[1]).map(t=>t[0])}function sR(r,t){let e=[];for(let o=t-r;o<t;++o)e.push(o);return e}function iR(r,t=null,e=!1){let n={x:T(r,"x","max")},s={reductionIndices:t,keepDims:e};return v.runKernel("Max",n,s)}var Nr=w({max_:iR});function cR(r,t=null,e=!1){let n={x:T(r,"x","min")},s={axis:t,keepDims:e};return v.runKernel("Min",n,s)}var ec=w({min_:cR});function pR(r,t){let e=T(r,"base","pow"),o=T(t,"exp","pow");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel("Pow",n)}var oi=w({pow_:pR});function lt(r,t){if((ke(r)&&t!=="string"||Array.isArray(r))&&t!=="complex64")throw new Error("Error creating a new Scalar: value must be a primitive (number|boolean|string)");if(t==="string"&&ke(r)&&!(r instanceof Uint8Array))throw new Error("When making a scalar from encoded string, the value must be `Uint8Array`.");return ye(r,[],[],t)}function lR(r){let e={x:T(r,"x","sqrt","float32")};return v.runKernel(yn,e)}var oc=w({sqrt_:lR});function uR(r){let t=T(r,"x","square"),e={};return v.runKernel("Square",{x:t},e)}var go=w({square_:uR});function mR(r,t=null,e=!1){let o=T(r,"x","sum");o.dtype==="bool"&&(o=kt(o,"int32"));let n={x:o},s={axis:t,keepDims:e};return v.runKernel("Sum",n,s)}var wt=w({sum_:mR});function fR(r,t="euclidean",e=null,o=!1){r=T(r,"x","norm");let n=ly(r,t,e),s=n.shape;if(o){let a=eo(e,r.shape);s=Mr(n.shape,a)}return P(n,s)}function ly(r,t,e=null){if(r.rank===0)return fe(r);if(r.rank!==1&&e===null)return ly(P(r,[-1]),t,e);if(r.rank===1||typeof e=="number"||Array.isArray(e)&&e.length===1){if(t===1)return wt(fe(r),e);if(t===1/0)return Nr(fe(r),e);if(t===-1/0)return ec(fe(r),e);if(t==="euclidean"||t===2)return oc(wt(oi(fe(r),lt(2,"int32")),e));throw new Error(`Error in norm: invalid ord value: ${t}`)}if(Array.isArray(e)&&e.length===2){if(t===1)return Nr(wt(fe(r),e[0]),e[1]-1);if(t===1/0)return Nr(wt(fe(r),e[1]),e[0]);if(t===-1/0)return ec(wt(fe(r),e[1]),e[0]);if(t==="fro"||t==="euclidean")return oc(wt(go(r),e));throw new Error(`Error in norm: invalid ord value: ${t}`)}throw new Error(`Error in norm: invalid axis: ${e}`)}var Ln=w({norm_:fR});function dR(r,t=null,e=!1){return Ln(r,"euclidean",t,e)}var uy=w({euclideanNorm_:dR});function hR(r){let e={x:T(r,"x","exp")};return v.runKernel("Exp",e)}var je=w({exp_:hR});function gR(r,t=0){let e=T(r,"x","expandDims","string_or_numeric");E(t<=e.rank,()=>"Axis must be <= rank of the tensor");let o={input:e},n={dim:t};return v.runKernel(zs,o,n)}var zr=w({expandDims_:gR});function xR(r){let e={x:T(r,"x","expm1")};return v.runKernel(Go,e)}var my=w({expm1_:xR});function yR(r,t){let e=T(r,"x","tile","string_or_numeric");E(e.rank===t.length,()=>`Error in transpose: rank of input ${e.rank} must match length of reps ${t}.`);let o={x:e},n={reps:t};return v.runKernel(no,o,n)}var xo=w({tile_:yR});function bR(r,t,e,o="float32"){t==null&&(t=r);let n=tt([r,t],o),s=r<=t?r:t;for(let i=0;i<s;++i)n.set(1,i,i);let a=P(n.toTensor(),[r,t]);if(e==null)return a;if(e.length===1)return xo(zr(a,0),[e[0],1,1]);if(e.length===2)return xo(zr(zr(a,0),0),[e[0],e[1],1,1]);if(e.length===3)return xo(zr(zr(zr(a,0),0),0),[e[0],e[1],e[2],1,1]);throw new Error(`eye() currently supports only 1D and 2D batchShapes, but received ${e.length}D.`)}var Dp=w({eye_:bR});function CR(r){let e={x:T(r,"x","floor","float32")};return v.runKernel(Uo,e)}var _p=w({floor_:CR});function TR(r,t,e=0,o=0){let n=T(r,"x","gather"),s=T(t,"indices","gather","int32"),a={x:n,indices:s},i={axis:e,batchDims:o};return v.runKernel(Hs,a,i)}var Op=w({gather_:TR});function SR(r,t){let e=T(r,"a","greater","string_or_numeric"),o=T(t,"b","greater","string_or_numeric");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(Ko,n)}var Bn=w({greater_:SR});function wR(r,t){let e=T(r,"a","greaterEqual","string_or_numeric"),o=T(t,"b","greaterEqual","string_or_numeric");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(qo,n)}var Pp=w({greaterEqual_:wR});function NR(r){let e={x:T(r,"x","isFinite")};return v.runKernel(Xo,e)}var fy=w({isFinite_:NR});function IR(r){let e={x:T(r,"x","isInf")};return v.runKernel(jo,e)}var dy=w({isInf_:IR});function vR(r){let e={x:T(r,"x","isNaN")};return v.runKernel(Yo,e)}var hy=w({isNaN_:vR});function kR(r,t=.2){let o={x:T(r,"x","leakyRelu")},n={alpha:t};return v.runKernel(js,o,n)}var Lp=w({leakyRelu_:kR});function ER(r,t){let e=T(r,"a","less","string_or_numeric"),o=T(t,"b","less","string_or_numeric");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(Zo,n)}var gy=w({less_:ER});function $R(r,t){let e=T(r,"a","lessEqual","string_or_numeric"),o=T(t,"b","lessEqual","string_or_numeric");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(Qo,n)}var ni=w({lessEqual_:$R});function xy(r,t,e){if(e<=0)throw new Error("The number of values should be positive.");let o={start:r,stop:t,num:e};return v.runKernel(Ys,{},o)}function RR(r,t=5,e=1,o=1,n=.5){let s=T(r,"x","localResponseNormalization");E(s.rank===4||s.rank===3,()=>`Error in localResponseNormalization: x must be rank 3 or 4 but got
               rank ${s.rank}.`),E(Pr(t),()=>`Error in localResponseNormalization: depthRadius must be an integer but got depthRadius ${t}.`);let a=s,i=!1;s.rank===3&&(i=!0,a=P(s,[1,s.shape[0],s.shape[1],s.shape[2]]));let c={x:a},p={depthRadius:t,bias:e,alpha:o,beta:n},l=v.runKernel("LRN",c,p);return i?P(l,[l.shape[1],l.shape[2],l.shape[3]]):l}var yy=w({localResponseNormalization_:RR});function AR(r){let e={x:T(r,"x","log","float32")};return v.runKernel("Log",e)}var Wr=w({log_:AR});function FR(r){let e={x:T(r,"x","log1p")};return v.runKernel(Jo,e)}var Vp=w({log1p_:FR});function Ie(r){return v.customGrad(r)}function DR(r){let e={x:T(r,"x","softplus")};return v.runKernel(xn,e)}var Mp=w({softplus_:DR});function _R(r){let t=T(r,"x","logSigmoid");return Ie(o=>({value:be(Mp(be(o))),gradFunc:a=>at(a,wr(be(o)))}))(t)}var by=w({logSigmoid_:_R});function OR(r,t){let e=T(r,"a","sub"),o=T(t,"b","sub");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel("Sub",n)}var ut=w({sub_:OR});function PR(r,t=-1){let e=T(r,"logits","logSoftmax");if(t===-1&&(t=e.rank-1),t!==e.rank-1)throw Error(`Log Softmax along a non-last dimension is not yet supported. Logits was rank ${e.rank} and axis was ${t}`);return Ie((n,s)=>{let i=Nr(n,t,!0),c=ut(n,i),p=ut(kt(c,"float32"),Wr(wt(je(c),t,!0)));return s([p]),{value:p,gradFunc:(u,m)=>{let[f]=m,d=!0,h=je(f);return ut(u,at(wt(u,t,d),h))}}})(e)}var Cy=w({logSoftmax_:PR});function LR(r,t=null,e=!1){let o=T(r,"x","logSumExp"),n=eo(t,o.shape),s=Nr(o,n,!0),a=ut(o,s),i=je(a),c=wt(i,n),p=Wr(c),l=Et(P(s,p.shape),p);if(e){let u=Mr(l.shape,n);return P(l,u)}return l}var zp=w({logSumExp_:LR});function BR(r,t){let e=T(r,"a","logicalAnd","bool"),o=T(t,"b","logicalAnd","bool");Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(tn,n)}var Vn=w({logicalAnd_:BR});function VR(r){let e={x:T(r,"x","logicalNot","bool")};return v.runKernel(en,e)}var Wp=w({logicalNot_:VR});function MR(r,t){let e=T(r,"a","logicalOr","bool"),o=T(t,"b","logicalOr","bool");Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(rn,n)}var Gp=w({logicalOr_:MR});function zR(r,t){let e=T(r,"a","logicalXor","bool"),o=T(t,"b","logicalXor","bool");return Tt(e.shape,o.shape),Vn(Gp(r,t),Wp(Vn(r,t)))}var Ty=w({logicalXor_:zR});var Up=2147483648;function WR(r,t,e="left"){let o=T(r,"sortedSequence","searchSorted"),n=T(t,"values","searchSorted"),s=o.shape[o.shape.length-1],a=n.shape[n.shape.length-1],i=P(o,[-1,s]),c=P(n,[-1,a]);if(i.rank<2)throw new Error("Sorted input argument must be at least 2-dimensional");if(i.shape[0]!==c.shape[0])throw new Error("Leading dimension of 'sortedSequence' and 'values' must match.");if(xt(c.shape)>=Up)throw new Error(`values tensor size must less than ${Up}`);if(i.shape[1]>=Up)throw new Error(`trailing dim_size must less than ${Up} for int32 output type, was ${i.shape[1]}`);let p={sortedSequence:i,values:c},l={side:e};return v.runKernel(Ta,p,l)}var ic=w({searchSorted_:WR});function Sy(r,t){return ic(r,t,"left")}function GR(r,t,e,o,n){let s=T(r,"x","maxPool"),a=1,i=s,c=!1;s.rank===3&&(c=!0,i=P(s,[1,s.shape[0],s.shape[1],s.shape[2]])),E(i.rank===4,()=>`Error in maxPool: input must be rank 4 but got rank ${i.rank}.`),E(de(e,a),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${e} and dilations '${a}'`),Zt("maxPool",o,n);let p={x:i},l={filterSize:t,strides:e,pad:o,dimRoundingMode:n},u=v.runKernel(Zs,p,l);return c?P(u,[u.shape[1],u.shape[2],u.shape[3]]):u}var Hp=w({maxPool_:GR});function UR(r,t=[1,1,1],e,o,n,s="NDHWC"){let a=T(r,"x","maxPool3d"),i=a,c=!1;a.rank===4&&(c=!0,i=P(a,[1,a.shape[0],a.shape[1],a.shape[2],a.shape[3]])),E(i.rank===5,()=>`Error in maxPool3d: x must be rank 5 but got rank ${i.rank}.`),E(s==="NDHWC",()=>`Error in maxPool3d: Only NDHWC is currently supported, but got dataFormat of ${s}`),Zt("maxPool3d",o,n);let p={x:i},l={filterSize:t,strides:e,pad:o,dimRoundingMode:n,dataFormat:s},u=v.runKernel(Qs,p,l);return c?P(u,[u.shape[1],u.shape[2],u.shape[3],u.shape[4]]):u}var wy=w({maxPool3d_:UR});function HR(r,t,e,o,n=!1){let a={x:T(r,"x","maxPoolWithArgmax")},i={filterSize:t,strides:e,pad:o,includeBatchInIndex:n},c=v.runKernel(Js,a,i);return{result:c[0],indexes:c[1]}}var Ny=w({maxPoolWithArgmax_:HR});function KR(r,t){let e=T(r,"a","maximum"),o=T(t,"b","maximum");[e,o]=ft(e,o),e.dtype==="bool"&&(e=kt(e,"int32"),o=kt(o,"int32")),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(on,n)}var Iy=w({maximum_:KR});function qR(r,t=null,e=!1){let n={x:T(r,"x","mean")},s={axis:t,keepDims:e};return v.runKernel(ta,n,s)}var Mn=w({mean_:qR});function Ye(r,t="float32"){if(t==="complex64"){let o=Ye(r,"float32"),n=Ye(r,"float32");return Ne(o,n)}let e=ms(xt(r),t);return v.makeTensor(e,r,t)}function Ir(r,t="float32"){if(t==="complex64"){let o=Ir(r,"float32"),n=Ye(r,"float32");return Ne(o,n)}let e=Pi(xt(r),t);return v.makeTensor(e,r,t)}function vy(r,t,{indexing:e="xy"}={}){if(e!=="xy"&&e!=="ij")throw new TypeError(`${e} is not a valid third argument to meshgrid`);if(r===void 0)return[];let o=T(r,"x","meshgrid",r instanceof Lt?r.dtype:"float32");if(t===void 0)return[o];let n=T(t,"y","meshgrid",t instanceof Lt?t.dtype:"float32"),s=xt(o.shape),a=xt(n.shape);return e==="xy"?(o=P(o,[1,-1]),n=P(n,[-1,1]),[St(Ir([a,1],o.dtype),o),St(n,Ir([1,s],n.dtype))]):(o=P(o,[-1,1]),n=P(n,[1,-1]),[St(o,Ir([1,a],o.dtype)),St(Ir([s,1],n.dtype),n)])}function XR(r,t){let e=T(r,"a","minimum"),o=T(t,"b","minimum");[e,o]=ft(e,o),e.dtype==="bool"&&(e=kt(e,"int32"),o=kt(o,"int32")),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(nn,n)}var Kp=w({minimum_:XR});function jR(r,t,e){E(e==="reflect"||e==="symmetric",()=>`Invalid mode. Mode must be either reflect or symmetric. Got ${e}.`);let o=T(r,"x","mirrorPad");if(o.rank===0)throw new Error("mirrorPad(scalar) is not defined. Pass non-scalar to mirrorPad");E(t.length===o.rank,()=>`Padding doesn't match input. Must be ${o.rank}. Got ${t.length}.`);let n=e==="reflect"?1:0;for(let i=0;i<o.rank;i++)E(t[i].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),E(t[i][0]>=0&&t[i][0]<=o.shape[i]-n&&t[i][1]>=0&&t[i][1]<=o.shape[i]-n,()=>`Padding in dimension ${i} cannot be greater than or equal to ${o.shape[i]-n} or less than 0 for input of shape ${o.shape}`);let s={paddings:t,mode:e},a={x:o};return v.runKernel(ea,a,s)}var ky=w({mirrorPad_:jR});function YR(r,t){let e=T(r,"a","mod"),o=T(t,"b","mod");[e,o]=ft(e,o);let n={a:e,b:o};return v.runKernel("Mod",n)}var Ey=w({mod_:YR});function ZR(r,t=null,e=!1){r=T(r,"x","moments");let o=eo(t,r.shape),n=Mn(r,o,e),s=n.shape;e||(s=Mr(n.shape,o));let a=go(ut(kt(r,"float32"),P(n,s))),i=Mn(a,o,e);return{mean:n,variance:i}}var $y=w({moments_:ZR});function QR(r,t,e,o){let n=T(t,"data","multiRNNCell"),s=Fn(e,"c","multiRNNCell"),a=Fn(o,"h","multiRNNCell"),i=n,c=[];for(let u=0;u<r.length;u++){let m=r[u](i,s[u],a[u]);c.push(m[0]),c.push(m[1]),i=m[1]}let p=[],l=[];for(let u=0;u<c.length;u+=2)p.push(c[u]),l.push(c[u+1]);return[p,l]}var Ry=w({multiRNNCell_:QR});function JR(r,t,e,o=!1){let n=T(r,"logits","multinomial"),s=n.size,a=n.rank;if(s<2)throw new Error(`Error in multinomial: you need at least 2 outcomes, but got ${s}.`);if(a>2)throw new Error(`Rank of probabilities must be 1 or 2, but is ${a}`);e=e||Math.random();let c={logits:a===1?P(n,[1,-1]):n},p={numSamples:t,seed:e,normalized:o},l=v.runKernel(ra,c,p);return a===1?P(l,[l.size]):l}var Ay=w({multinomial_:JR});function tA(r,t){let e=T(r,"a","notEqual","string_or_numeric"),o=T(t,"b","notEqual","string_or_numeric");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o};return v.runKernel(an,n)}var qp=w({notEqual_:tA});function eA(r){let e={x:T(r,"x","onesLike")};return v.runKernel(aa,e)}var Fy=w({onesLike_:eA});function rA(r,t){let e=T(r,"v1","outerProduct"),o=T(t,"v2","outerProduct");E(e.rank===1&&o.rank===1,()=>`Error in outerProduct: inputs must be rank 1, but got ranks ${e.rank} and ${o.rank}.`);let n=P(e,[-1,1]),s=P(o,[1,-1]);return St(n,s)}var Dy=w({outerProduct_:rA});function oA(r,t,e=0){let o=T(r,"x","pad");if(o.rank===0)throw new Error("pad(scalar) is not defined. Pass non-scalar to pad");let n={paddings:t,constantValue:e},s={x:o};return v.runKernel(pa,s,n)}var vr=w({pad_:oA});function nA(r,t,e=0){return E(t.length===2,()=>"Invalid number of paddings. Must be length of 2."),vr(r,[t],e)}var _y=w({pad1d_:nA});function sA(r,t,e=0){return E(t.length===2&&t[0].length===2&&t[1].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),vr(r,t,e)}var Oy=w({pad2d_:sA});function aA(r,t,e=0){return E(t.length===3&&t[0].length===2&&t[1].length===2&&t[2].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),vr(r,t,e)}var Py=w({pad3d_:aA});function iA(r,t,e=0){return E(t.length===4&&t[0].length===2&&t[1].length===2&&t[2].length===2&&t[3].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),vr(r,t,e)}var Ly=w({pad4d_:iA});function cA(r,t,e){let o=T(r,"x","spaceToBatchND");E(o.rank>=1+t.length,()=>`input rank ${o.rank} should be > than [blockShape] ${t.length}`),E(e.length===t.length,()=>`paddings.shape[0] ${e.length} must be equal to [blockShape] ${t.length}`),E(o.shape.reduce((a,i,c)=>c>0&&c<=t.length?a&&(i+e[c-1][0]+e[c-1][1])%t[c-1]===0:a,!0),()=>`input spatial dimensions ${o.shape.slice(1)} with paddings ${e.toString()} must be divisible by blockShapes ${t.toString()}`);let n={x:o},s={blockShape:t,paddings:e};return v.runKernel(Na,n,s)}var Xp=w({spaceToBatchND_:cA});function pA(r,t,e,o,n,s,a){n==null&&(n=[1,1]),s==null&&(s=1),o===0&&(o="valid");let i=T(r,"x","maxPool"),c=i,p=!1;i.rank===3&&(p=!0,c=P(i,[1,i.shape[0],i.shape[1],i.shape[2]])),E(de(s,n),()=>`Error in pool: Either strides or dilations must be 1. Got strides ${s} and dilations '${n}'`);let l=Wf(c.shape,t,s,n,o),u=[l.dilationHeight,l.dilationWidth],m;o==="same"?m=uA([l.filterHeight,l.filterWidth],u):m=[[0,0],[0,0]];let f=u[0]===1&&u[1]===1,[d,h]=lA([l.inHeight,l.inWidth],u,m),g=f?o:"valid",x=f?c:Xp(c,u,d),S=(e==="avg"?()=>Np(x,t,s,g,a):()=>Hp(x,t,s,g,a))(),N=f?S:Ip(S,u,h);return p?P(N,[N.shape[1],N.shape[2],N.shape[3]]):N}function lA(r,t,e){let o=e.map(l=>l[0]),n=e.map(l=>l[1]),s=r.concat(o,n),a=t.map((l,u)=>(l-s[u]%l)%l),i=n.map((l,u)=>l+a[u]),c=t.map((l,u)=>[o[u],i[u]]),p=t.map((l,u)=>[0,a[u]]);return[c,p]}function uA(r,t){let o=r.map((a,i)=>a+(a-1)*(t[i]-1)).map(a=>a-1),n=o.map(a=>Math.floor(a/2)),s=o.map((a,i)=>a-n[i]);return o.map((a,i)=>[n[i],s[i]])}var By=w({pool_:pA});function mA(r,t){let e=T(r,"x","prelu"),o=T(t,"alpha","prelu"),n={x:e,alpha:o};return v.runKernel(la,n)}var jp=w({prelu_:mA});function fA(r,t=null,e=!1){let o=T(r,"x","prod");o.dtype==="bool"&&(o=kt(o,"int32"));let n={x:o},s={axis:t,keepDims:e};return v.runKernel(ua,n,s)}var Vy=w({prod_:fA});function dA(r,t,e,o){let n=r.map((l,u)=>T(l,`tensors${u}`,"raggedGather","int32")),s=T(t,"paramsDenseValues","raggedGather"),a=T(e,"indices","raggedGather","int32"),i={paramsNestedSplits:n,paramsDenseValues:s,indices:a},c={outputRaggedRank:o},p=v.runKernel(ma,i,c);return{outputNestedSplits:p.slice(0,p.length-1),outputDenseValues:p[p.length-1]}}var My=w({raggedGather_:dA});function hA(r,t,e,o,n){let s=T(r,"shape","raggedTensorToTensor","int32"),a=T(t,"values","raggedTensorToTensor"),i=T(e,"defaultValue","raggedTensorToTensor",a.dtype),c=o.map((u,m)=>T(u,`tensors${m}`,"raggedTensorToTensor","int32")),p={shape:s,values:a,defaultValue:i,rowPartitionTensors:c},l={rowPartitionTypes:n};return v.runKernel(fa,p,l)}var zy=w({raggedTensorToTensor_:hA});function gA(r,t,e){let o=xt(r),n=null;if(e==null||e==="float32")n=new Float32Array(o);else if(e==="int32")n=new Int32Array(o);else if(e==="bool")n=new Uint8Array(o);else throw new Error(`Unknown data type ${e}`);for(let s=0;s<o;s++)n[s]=t();return v.makeTensor(n,r,e)}var Wy=w({rand_:gA});var Jp=Hm(Zf());var Wn=class{constructor(t,e,o,n,s){this.mean=t,this.stdDev=e,this.dtype=o,this.nextVal=NaN,this.truncated=n,this.truncated&&(this.upper=this.mean+this.stdDev*2,this.lower=this.mean-this.stdDev*2);let a=s||Math.random();this.random=Jp.alea(a.toString())}nextValue(){if(!isNaN(this.nextVal)){let n=this.nextVal;return this.nextVal=NaN,n}let t,e,o=!1;for(;!o;){let n,s,a;do n=2*this.random()-1,s=2*this.random()-1,a=n*n+s*s;while(a>=1||a===0);let i=Math.sqrt(-2*Math.log(a)/a);t=this.mean+this.stdDev*n*i,e=this.mean+this.stdDev*s*i,(!this.truncated||this.isValidTruncated(t))&&(o=!0)}return(!this.truncated||this.isValidTruncated(e))&&(this.nextVal=this.convertValue(e)),this.convertValue(t)}convertValue(t){return this.dtype==null||this.dtype==="float32"?t:Math.round(t)}isValidTruncated(t){return t<=this.upper&&t>=this.lower}},Zp=class{constructor(t,e,o,n){this.alpha=t,this.beta=1/e,this.dtype=o;let s=n||Math.random();this.randu=Jp.alea(s.toString()),this.randn=new Wn(0,1,o,!1,this.randu()),t<1?this.d=t+2/3:this.d=t-1/3,this.c=1/Math.sqrt(9*this.d)}nextValue(){let t,e,o,n,s,a;for(;;){do n=this.randn.nextValue(),a=1+this.c*n;while(a<=0);if(a*=a*a,t=n*n,e=1-.331*t*t,o=.5*t+this.d*(1-a+Math.log(a)),s=this.randu(),s<e||Math.log(s)<o)break}return a=1/this.beta*this.d*a,this.alpha<1&&(a*=Math.pow(this.randu(),1/this.alpha)),this.convertValue(a)}convertValue(t){return this.dtype==="float32"?t:Math.round(t)}},Qp=class{constructor(t=0,e=1,o,n){if(this.canReturnFloat=()=>this.dtype==null||this.dtype==="float32",this.min=t,this.range=e-t,this.dtype=o,n==null&&(n=Math.random()),typeof n=="number"&&(n=n.toString()),!this.canReturnFloat()&&this.range<=1)throw new Error(`The difference between ${t} - ${e} <= 1 and dtype is not float`);this.random=Jp.alea(n)}convertValue(t){return this.canReturnFloat()?t:Math.round(t)}nextValue(){return this.convertValue(this.min+this.range*this.random())}};function wA(r,t,e=1,o="float32",n){if(e==null&&(e=1),o==null&&(o="float32"),o!=="float32"&&o!=="int32")throw new Error(`Unsupported data type ${o}`);let s=new Zp(t,e,o,n),a=tt(r,o);for(let i=0;i<a.values.length;i++)a.values[i]=s.nextValue();return a.toTensor()}var sb=w({randomGamma_:wA});function NA(r,t=0,e=1,o,n){if(o!=null&&o==="bool")throw new Error(`Unsupported data type ${o}`);let s=new Wn(t,e,o,!1,n),a=tt(r,o);for(let i=0;i<a.values.length;i++)a.values[i]=s.nextValue();return a.toTensor()}var tl=w({randomNormal_:NA});function IA(r,t,e){if(t!=null&&t==="bool")throw new Error(`Unsupported data type ${t}`);return tl(r,0,1,t,e)}var ab=w({randomStandardNormal_:IA});function vA(r,t=0,e=1,o="float32",n){let s=tt(r,o),a=new Qp(t,e,null,n);for(let i=0;i<s.values.length;i++)s.values[i]=a.nextValue();return s.toTensor()}var el=w({randomUniform_:vA});function yo(r,t,e=1,o="float32"){if(e===0)throw new Error("Cannot have a step of zero");let n={start:r,stop:t,step:e,dtype:o};return v.runKernel(da,{},n)}function kA(r){let e={x:T(r,"x","reciprocal")};return v.runKernel(cn,e)}var ib=w({reciprocal_:kA});function EA(r){let e={x:T(r,"x","relu")};return v.runKernel(pn,e)}var bo=w({relu_:EA});function $A(r){let e={x:T(r,"x","relu6")};return v.runKernel(ln,e)}var rl=w({relu6_:$A});function RA(r,t){let o={x:T(r,"x","reverse")},n={dims:t};return v.runKernel(ba,o,n)}var Be=w({reverse_:RA});function AA(r){let t=T(r,"x","reverse");return E(t.rank===1,()=>`Error in reverse1D: x must be rank 1 but got rank ${t.rank}.`),Be(t,0)}var cb=w({reverse1d_:AA});function FA(r,t){let e=T(r,"x","reverse");return E(e.rank===2,()=>`Error in reverse2D: x must be rank 2 but got rank ${e.rank}.`),Be(e,t)}var pb=w({reverse2d_:FA});function DA(r,t){let e=T(r,"x","reverse");return E(e.rank===3,()=>`Error in reverse3D: x must be rank 3 but got rank ${e.rank}.`),Be(e,t)}var lb=w({reverse3d_:DA});function _A(r,t){let e=T(r,"x","reverse");return E(e.rank===4,()=>`Error in reverse4D: x must be rank 4 but got rank ${e.rank}.`),Be(e,t)}var ub=w({reverse4d_:_A});function OA(r){let e={x:T(r,"x","round")};return v.runKernel(un,e)}var ol=w({round_:OA});function PA(r){let e={x:T(r,"x","rsqrt","float32")};return v.runKernel(mn,e)}var mb=w({rsqrt_:PA});function LA(r){let e={x:T(r,"x","selu")};return v.runKernel(fn,e)}var fb=w({selu_:LA});function BA(r,t,e,o,n,s=[1,1],a="NHWC"){let i=T(r,"x","separableConv2d"),c=T(t,"depthwiseFilter","separableConv2d"),p=T(e,"pointwiseFilter","separableConv2d"),l=i,u=!1;if(i.rank===3&&(u=!0,l=P(i,[1,i.shape[0],i.shape[1],i.shape[2]])),a==="NCHW")throw new Error("separableConv2d currently does not support dataFormat NCHW; only NHWC is supported");E(l.rank===4,()=>`Error in separableConv2d: input must be rank 4, but got rank ${l.rank}.`),E(c.rank===4,()=>`Error in separableConv2d: depthwise filter must be rank 4, but got rank ${c.rank}.`),E(p.rank===4,()=>`Error in separableConv2d: pointwise filter must be rank 4, but got rank ${c.rank}.`),E(p.shape[0]===1,()=>`Error in separableConv2d: the first dimension of pointwise filter  must be 1, but got ${p.shape[0]}.`),E(p.shape[1]===1,()=>`Error in separableConv2d: the second dimension of pointwise filter must be 1, but got ${p.shape[1]}.`);let m=c.shape[2],f=c.shape[3];E(p.shape[2]===m*f,()=>`Error in separableConv2d: the third dimension of pointwise filter must be ${m*f}, but got ${p.shape[2]}.`);let d=ei(l,c,o,n,a,s),g=ho(d,p,1,"valid",a);return u?P(g,[g.shape[1],g.shape[2],g.shape[3]]):g}var db=w({separableConv2d_:BA});async function VA(r,t){let e=T(r,"x","setdiff1d"),o=T(t,"y","setdiff1d");E(e.dtype===o.dtype,()=>`x and y should have the same dtype, but got x (${e.dtype}) and y (${o.dtype}).`),E(e.rank===1,()=>`x should be 1D tensor, but got x (${e.shape}).`),E(o.rank===1,()=>`y should be 1D tensor, but got y (${o.shape}).`);let n=await e.data(),s=await o.data(),a=new Set(s),i=0;for(let l=0;l<n.length;l++)a.has(n[l])||i++;let c=new vt([i],e.dtype),p=new vt([i],"int32");for(let l=0,u=0;l<n.length;l++)a.has(n[l])||(c.values[u]=n[l],p.values[u]=l,u++);return[c.toTensor(),p.toTensor()]}var hb=VA;function MA(r){let e={x:T(r,"x","sign")};return v.runKernel(hn,e)}var gb=w({sign_:MA});function zA(r){let e={x:T(r,"x","sin","float32")};return v.runKernel("Sin",e)}var xb=w({sin_:zA});function WA(r){let e={x:T(r,"x","sinh")};return v.runKernel(dn,e)}var yb=w({sinh_:WA});function GA(r,t,e){let o=T(r,"x","slice1d");return E(o.rank===1,()=>`slice1d expects a rank-1 tensor, but got a rank-${o.rank} tensor`),yt(o,[t],[e])}var bb=w({slice1d_:GA});function UA(r,t,e){let o=T(r,"x","slice2d");return E(o.rank===2,()=>`slice2d expects a rank-2 tensor, but got a rank-${o.rank} tensor`),yt(o,t,e)}var Cb=w({slice2d_:UA});function HA(r,t,e){let o=T(r,"x","slice3d");return E(o.rank===3,()=>`slice3d expects a rank-3 tensor, but got a rank-${o.rank} tensor`),yt(o,t,e)}var Tb=w({slice3d_:HA});function KA(r,t,e){let o=T(r,"x","slice4d");return E(o.rank===4,()=>`slice4d expects a rank-4 tensor, but got a rank-${o.rank} tensor`),yt(o,t,e)}var Sb=w({slice4d_:KA});function qA(r,t=-1){let e=T(r,"logits","softmax","float32");if(t===-1&&(t=e.rank-1),t!==e.rank-1)throw Error(`Softmax along a non-last dimension is not yet supported. Logits was rank ${e.rank} and dim was ${t}`);let o={logits:e},n={dim:t};return v.runKernel(va,o,n)}var wb=w({softmax_:qA});function XA(r){E(r.dtype==="complex64",()=>`The dtype for tf.spectral.fft() must be complex64 but got ${r.dtype}.`);let t={input:r};return v.runKernel("FFT",t)}var si=w({fft_:XA});function jA(r){E(r.dtype==="complex64",()=>`The dtype for tf.spectral.ifft() must be complex64 but got ${r.dtype}.`);let t={input:r};return v.runKernel(qs,t)}var Gn=w({ifft_:jA});function YA(r){let t=r.shape[r.shape.length-1],e=r.size/t,o;if(t<=2){let n=P(r,[e,t]);o=Gn(n)}else{let n=[e,2*(t-1)],s=P(Vr(r),[e,t]),a=P(lo(r),[e,t]),i=Be(yt(s,[0,1],[e,t-2]),1),c=at(Be(yt(a,[0,1],[e,t-2]),1),lt(-1)),p=Dt([s,i],1),l=Dt([a,c],1),u=P(Ne(p,l),[n[0],n[1]]);o=Gn(u)}if(o=Vr(o),r.rank===3&&r.shape[0]!==0){let n=o,s=r.shape[0];o=P(o,[s,o.shape[0]/s,o.shape[1]]),n.dispose()}return o}var sl=w({irfft_:YA});function ZA(r,t,e=0){let n={x:T(r,"x","split")},s={numOrSizeSplits:t,axis:e};return v.runKernel(Ia,n,s)}var Gr=w({split_:ZA});function QA(r,t){E(r.dtype==="float32",()=>`The dtype for rfft() must be real value but got ${r.dtype}`);let e=r.shape[r.shape.length-1],o=r.size/e,n;if(t!=null&&t<e){let d=r.shape.map(g=>0),h=r.shape.map(g=>g);h[r.shape.length-1]=t,n=yt(r,d,h),e=t}else if(t!=null&&t>e){let d=r.shape.map(h=>h);d[r.shape.length-1]=t-e,n=Dt([r,Ye(d)],r.shape.length-1),e=t}else n=r;let s=ri(n),a=P(Ne(n,s),[o,e]),i=si(a),c=Math.floor(e/2)+1,p=Vr(i),l=lo(i),u=Gr(p,[c,e-c],p.shape.length-1),m=Gr(l,[c,e-c],l.shape.length-1),f=n.shape.slice();return f[n.shape.length-1]=c,P(Ne(u[0],m[0]),f)}var ai=w({rfft_:QA});function JA(r,t){let e=T(r,"a","squaredDifference"),o=T(t,"b","squaredDifference");[e,o]=ft(e,o),Tt(e.shape,o.shape);let n={a:e,b:o},s={};return v.runKernel(bn,n,s)}var al=w({squaredDifference_:JA});function tF(r,t){let e=T(r,"x","squeeze","string_or_numeric");return P(e,Km(e.shape,t).newShape)}var ii=w({squeeze_:tF});function eF(r,t=0){let e=Fn(r,"tensors","stack","string_or_numeric");E(e.length>=1,()=>"Pass at least one tensor to tf.stack"),e.length>0&&E(t<=e[0].rank,()=>"Axis must be <= rank of the tensor");let o=e,n={axis:t};return v.runKernel(ca,o,n)}var Ce=w({stack_:eF});function rF(r,t=0){let o={x:T(r,"x","step")},n={alpha:t};return v.runKernel(Tn,o,n)}var il=w({step_:rF});function oF(r,t,e,o,n=0,s=0,a=0,i=0,c=0){let l={x:T(r,"x","stridedSlice","string_or_numeric")},u={begin:t,end:e,strides:o,beginMask:n,endMask:s,ellipsisMask:a,newAxisMask:i,shrinkAxisMask:c};return v.runKernel(Fa,l,u)}var Nb=w({stridedSlice_:oF});function nF(r){let e={x:T(r,"x","tan","float32")};return v.runKernel("Tan",e)}var Ib=w({tan_:nF});function he(r,t){Le(r);let e=we(r,t);if(e.length!==1)throw new Error("tensor1d() requires values to be a flat/TypedArray");return ye(r,null,e,t)}function Co(r,t,e){if(Le(r),t!=null&&t.length!==2)throw new Error("tensor2d() requires shape to have two numbers");let o=we(r,e);if(o.length!==2&&o.length!==1)throw new Error("tensor2d() requires values to be number[][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor2d() requires shape to be provided when `values` are a flat/TypedArray");return ye(r,t,o,e)}function vb(r,t,e){if(Le(r),t!=null&&t.length!==4)throw new Error("tensor4d() requires shape to have four numbers");let o=we(r,e);if(o.length!==4&&o.length!==1)throw new Error("tensor4d() requires values to be number[][][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor4d() requires shape to be provided when `values` are a flat array");return ye(r,t,o,e)}function kb(r,t,e){if(Le(r),t!=null&&t.length!==5)throw new Error("tensor5d() requires shape to have five numbers");let o=we(r,e);if(o.length!==5&&o.length!==1)throw new Error("tensor5d() requires values to be number[][][][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor5d() requires shape to be provided when `values` are a flat array");return ye(r,t,o,e)}function Eb(r,t,e){if(Le(r),t!=null&&t.length!==6)throw new Error("tensor6d() requires shape to have six numbers");let o=we(r,e);if(o.length!==6&&o.length!==1)throw new Error("tensor6d() requires values to be number[][][][][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor6d() requires shape to be provided when `values` are a flat array");return t=t||o,ye(r,t,o,e)}function sF(r,t=1,e=!0){let o=T(r,"x","topk");if(o.rank===0)throw new Error("topk() expects the input to be of rank 1 or higher");let n=o.shape[o.shape.length-1];if(t<0)throw new Error(`'k' passed to topk() must be >= 0 but got ${t}`);if(t>n)throw new Error(`'k' passed to topk() must be <= the last dimension (${n}) but got ${t}`);let s={x:o},a={k:t,sorted:e},[i,c]=v.runKernel(Pa,s,a);return{values:i,indices:c}}var $b=w({topk_:sF});function aF(r,t=0,e=1,o,n){if(o!=null&&o==="bool")throw new Error("Unsupported data type $ { dtype }");let s=new Wn(t,e,o,!0,n),a=tt(r,o);for(let i=0;i<a.values.length;i++)a.values[i]=s.nextValue();return a.toTensor()}var Rb=w({truncatedNormal_:aF});function iF(r,t=0){let e=T(r,"x","unique","string_or_numeric");E(e.rank>0,()=>"The input tensor must be at least 1D");let o={x:e},n={axis:t},[s,a]=v.runKernel(Ba,o,n);return{values:s,indices:a}}var Ab=w({unique_:iF});function cF(r,t,e){let o=T(r,"x","unsortedSegmentSum"),n=T(t,"segmentIds","unsortedSegmentSum","int32");E(Pr(e),()=>"numSegments must be of dtype int");let s={x:o,segmentIds:n},a={numSegments:e};return v.runKernel(Ma,s,a)}var Fb=w({unsortedSegmentSum_:cF});function pF(r,t=0){let e=T(r,"x","unstack","string_or_numeric");E(t>=-e.shape.length&&t<e.shape.length,()=>`Axis = ${t} is not in [-${e.shape.length}, ${e.shape.length})`);let o={value:e},n={axis:t};return v.runKernel(Va,o,n)}var Ve=w({unstack_:pF});function Db(r,t){return ic(r,t,"right")}function _b(r,t=!0,e,o){return v.makeVariable(r,t,e,o)}function cl(r,t){let e=[];for(let s=0;s<t.length;s++)t[s]&&e.push(s);let o=tt(r,"int32"),n=tt([e.length,r.length],"int32");for(let s=0;s<e.length;s++){let a=o.indexToLoc(e[s]),i=s*r.length;n.values.set(a,i)}return n.toTensor()}async function lF(r){let t=T(r,"condition","whereAsync","bool"),e=await t.data(),o=cl(t.shape,e);return r!==t&&t.dispose(),o}var pl=lF;async function uF(r,t,e){let o=T(r,"tensor","boolMask"),n=T(t,"mask","boolMask","bool"),s=e??0,a=n.rank,i=o.shape;E(a>0,()=>"mask cannot be scalar"),qt(i.slice(s,s+a),n.shape,"mask's shape must match the first K dimensions of tensor's shape,");let c=1;for(let h=s;h<s+a;h++)c*=i[h];let p=i.slice(0,s).concat([c],i.slice(s+a)),l=P(o,p),u=P(n,[-1]),m=await pl(u),f=ii(m,[1]),d=Op(l,f,s);return r!==o&&o.dispose(),t!==n&&n.dispose(),f.dispose(),l.dispose(),u.dispose(),m.dispose(),d}var mF=uF;function fF(r,t,e,o,n=!0){let s=T(r,"v","movingAverage"),a=T(t,"x","movingAverage"),i=T(e,"decay","movingAverage");kg(s,a),E(He(s.shape,a.shape),()=>"Shape mismatch in v and x");let c=lt(1),p=ut(c,i),l=at(ut(a,s),p);if(n){E(o!=null,()=>"When using zeroDebias: true, step is required.");let u=T(o,"step","movingAverage");l=Ut(l,ut(c,oi(i,u)))}return Et(s,l)}var dF=w({movingAverage_:fF});function hF(r,t,e){let o=T(r,"indices","scatterND","int32"),n=T(t,"updates","scatterND");Vf(n,o,e);let s={indices:o,updates:n},a={shape:e};return v.runKernel(Ca,s,a)}var gF=w({scatterND_:hF});function Ob(r,t,e,o){if(r.dtype!=="int32")throw new Error(`tf.sparseToDense() expects the indices to be int32 type, but the dtype was ${r.dtype}.`);if(r.rank>2)throw new Error(`sparseIndices should be a scalar, vector, or matrix, but got shape ${r.shape}.`);let n=r.rank>0?r.shape[0]:1,s=r.rank>1?r.shape[1]:1;if(e.length!==s)throw new Error(`outputShape has incorrect number of elements:, ${e.length}, should be: ${s}.`);let a=t.size;if(!(t.rank===0||t.rank===1&&a===n))throw new Error(`sparseValues has incorrect shape ${t.shape}, should be [] or [${n}]`);if(t.dtype!==o.dtype)throw new Error("sparseValues.dtype must match defaultValues.dtype")}function yF(r,t,e,o=0){let n=T(r,"sparseIndices","sparseToDense","int32"),s=T(t,"sparseValues","sparseToDense","string_or_numeric"),a=T(o,"defaultValue","sparseToDense",s.dtype);Ob(n,s,e,a);let i={sparseIndices:n,sparseValues:s,defaultValue:a},c={outputShape:e};return v.runKernel(Aa,i,c)}var bF=w({sparseToDense_:yF});function CF(r,t){let e=T(t,"indices","gatherND","int32"),n={params:T(r,"x","gatherND","string_or_numeric"),indices:e};return v.runKernel(Ks,n)}var TF=w({gatherND_:CF});function Pb(r,t){if(t==null)return r.shape.slice();if(He(r.shape,t))return t;if(r.shape.length===t.length){let e=[];for(let o=0;o<r.shape.length;o++)t[o]==null&&r.shape[o]!=null?e.push(r.shape[o]):e.push(t[o]);return e}return t}function SF(r,t,e,o){let n=T(r,"x","dropout");if(E(n.dtype==="float32",()=>`x has to be a floating point tensor since it's going to be scaled, but got a ${n.dtype} tensor instead.`),E(t>=0&&t<1,()=>`rate must be a float in the range [0, 1), but got ${t}.`),t===0)return r instanceof Lt?n.clone():n;let s=Pb(n,e),a=1-t,i=Ut(_p(Et(el(s,0,1,"float32",o),a)),a);return at(n,i)}var wF=w({dropout_:SF});function Qf(r){return Math.floor(Math.pow(2,Math.ceil(Math.log(r)/Math.log(2))))}function uc(r,t,e){let o=1-r%2,n=new Float32Array(r);for(let s=0;s<r;++s){let a=2*Math.PI*s/(r+o-1);n[s]=t-e*Math.cos(a)}return he(n,"float32")}async function NF(r,t,e=1){let o=T(r,"predictions","inTopK"),n=T(t,"targets","inTopK");E(o.rank>1,()=>`inTopK() expects the predictions to be of rank 2 or higher, but got ${o.rank}`),E(o.rank-1===n.rank,()=>`predictions rank should be 1 larger than targets rank, but got predictions rank ${o.rank} and targets rank ${n.rank}`),qt(o.shape.slice(0,o.shape.length-1),n.shape,"predictions's shape should be align with the targets' shape, except the last dimension.");let s=o.shape[o.shape.length-1];E(e>0&&e<=s,()=>`'k' passed to inTopK() must be > 0 && <= the predictions last dimension (${s}), but got ${e}`);let a=await o.data(),i=await n.data(),[c,p]=[a.length/s,s],l=qm("bool",c);for(let u=0;u<c;u++){let m=u*p,f=a.subarray(m,m+p),d=[];for(let h=0;h<f.length;h++)d.push({value:f[h],index:h});d.sort((h,g)=>g.value-h.value),l[u]=0;for(let h=0;h<e;h++)if(d[h].index===i[u]){l[u]=1;break}}return r!==o&&o.dispose(),t!==n&&n.dispose(),me(l,n.shape,"bool")}var IF=NF;var Jf={};At(Jf,{conv2d:()=>Bb,depthwiseConv2d:()=>zb,matMul:()=>Wb});function vF(r,t,e,o,n,s="NHWC",a){let i=r;r.rank===3&&(i=P(r,[1,r.shape[0],r.shape[1],r.shape[2]]));let c=t;c.rank===3&&(c=P(t,[1,t.shape[0],t.shape[1],t.shape[2]])),E(i.rank===4,()=>`Error in conv2dDerFilter: input must be rank 4, but got shape ${i.shape}.`),E(c.rank===4,()=>`Error in conv2dDerFilter: dy must be rank 4, but got shape ${c.shape}.`),E(e.length===4,()=>`Error in conv2dDerFilter: filterShape must be length 4, but got ${e}.`);let p=s==="NHWC"?i.shape[3]:i.shape[1],l=s==="NHWC"?c.shape[3]:c.shape[1];E(p===e[2],()=>`Error in conv2dDerFilter: depth of input ${p}) must match input depth in filter (${e[2]}.`),E(l===e[3],()=>`Error in conv2dDerFilter: depth of dy (${l}) must match output depth for filter (${e[3]}).`),Zt("conv2dDerFilter",n,a);let u={x:i,dy:c},m={strides:o,pad:n,dataFormat:s,dimRoundingMode:a,filterShape:e};return v.runKernel(vs,u,m)}var Lb=w({conv2DBackpropFilter_:vF});function Un(r,t,e){if(e==null||e==="linear")return r;if(e==="relu")return at(r,il(t));throw new Error(`Cannot compute gradient for fused activation ${e}.`)}function Hn(r,t){let e=t,o=bp(r.shape,t.shape);return o.length>0&&(e=wt(e,o)),P(e,r.shape)}function Kn(r,t,e,o){if(t==="linear")return r;if(t==="relu")return bo(r);if(t==="elu")return $p(r);if(t==="relu6")return rl(r);if(t==="prelu")return jp(r,e);if(t==="leakyrelu")return Lp(r,o);if(t==="sigmoid")return wr(r);throw new Error(`Unknown fused activation ${t}.`)}var qn=(r,t)=>!(r>0)||t==="linear";function kF({x:r,filter:t,strides:e,pad:o,dataFormat:n="NHWC",dilations:s=[1,1],dimRoundingMode:a,bias:i,activation:c="linear",preluActivationWeights:p,leakyreluAlpha:l}){if(c=c||"linear",qn(v.state.gradientDepth,c)===!1){E(n==="NHWC",()=>`Error in fused conv2d: got dataFormat of ${n} but only NHWC is currently supported for the case of gradient depth is 0 and the activation is not linear.`);let $=ho(r,t,e,o,n,s,a);return i!=null&&($=Et($,i)),Kn($,c,p,l)}let u=T(r,"x","conv2d","float32"),m=T(t,"filter","conv2d","float32"),f=u,d=!1;u.rank===3&&(d=!0,f=P(u,[1,u.shape[0],u.shape[1],u.shape[2]])),E(f.rank===4,()=>`Error in fused conv2d: input must be rank 4, but got rank ${f.rank}.`),E(m.rank===4,()=>`Error in fused conv2d: filter must be rank 4, but got rank ${m.rank}.`),Zt("fused conv2d",o,a);let h=n==="NHWC"?f.shape[3]:f.shape[1];E(m.shape[2]===h,()=>`Error in conv2d: depth of input (${h}) must match input depth for filter ${m.shape[2]}.`),E(de(e,s),()=>`Error in conv2D: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`);let g=Pn(f.shape,m.shape,e,s,o,a),x;i!=null&&(x=T(i,"bias","fused conv2d"),[x]=ft(x,u),n==="NHWC"?Tt(g.outShape,x.shape):(E(x.shape.length<=1,()=>`Error in fused conv2d: only supports scalar or 1-D Tensor bias for NCHW format but got the bias of rank-${x.shape.length}.`),E(x.shape.length===0||x.shape[0]===g.outChannels||x.shape[0]===1,()=>`Error in fused conv2d: bias shape (${x.shape}) is not compatible with the number of output channels (${g.outChannels})`)));let b;if(p!=null){let $=p.shape;if(E($.length<=1||$.length===3,()=>`Error in fused conv2d: only supports scalar, 1-D Tensor or 3-D Tensor PReLU activation weights but got a tensor of rank-${$.length}.`),$.length===1)E($[0]===1||$[0]===g.outChannels,()=>`Error in fused conv2d: PReLU activation weights (${$}) is not compatible with the number of output channels (${g.outChannels}).`);else if($.length===3)try{Tt($,g.outShape)}catch{let A=`Error in fused conv2d: PReLU activation weights (${$}) is not compatible with the output shape of the conv2d (${g.outShape}).`;throw Error(A)}b=T(p,"prelu weights","fused conv2d")}let S=($,R)=>{E(n==="NHWC",()=>`Error in gradient of fused conv2D: got dataFormat of ${n} but only NHWC is currently supported.`);let[A,D,_,O]=R,L=Un($,_,c);E(On(s),()=>`Error in gradient of fused conv2D: dilation rates greater than 1 are not yet supported in gradients. Got dilations '${s}'`);let B=kp(D.shape,L,A,e,o),M=Lb(D,L,A.shape,e,o),V=[B,M];if(O!=null){let G=Hn(O,L);V.push(G)}return V},N={x:f,filter:m,bias:x,preluActivationWeights:b},k={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a,activation:c,leakyreluAlpha:l};return i==null?Ie((R,A,D)=>{let _=v.runKernel(wn,N,k);return D([A,R,_]),d&&(_=P(_,[_.shape[1],_.shape[2],_.shape[3]])),{value:_,gradFunc:S}})(f,m):Ie((R,A,D,_)=>{let O=v.runKernel(wn,N,k);return _([A,R,O,D]),d&&(O=P(O,[O.shape[1],O.shape[2],O.shape[3]])),{value:O,gradFunc:S}})(f,m,x)}var Bb=w({fusedConv2d_:kF});function EF(r,t,e,o,n,s=[1,1],a){let i=r;r.rank===3&&(i=P(r,[1,r.shape[0],r.shape[1],r.shape[2]]));let c=t;c.rank===3&&(c=P(t,[1,t.shape[0],t.shape[1],t.shape[2]]));let p={x:i,dy:c},l={strides:o,pad:n,dimRoundingMode:a,dilations:s,filterShape:e};return v.runKernel(Ps,p,l)}var Vb=w({depthwiseConv2dNativeBackpropFilter_:EF});function $F(r,t,e,o,n,s=[1,1],a){let i=t,c=!1;t.rank===3&&(c=!0,i=P(t,[1,t.shape[0],t.shape[1],t.shape[2]]));let p={dy:i,filter:e},l={strides:o,pad:n,dimRoundingMode:a,dilations:s,inputShape:r},u=v.runKernel(Ls,p,l);return c?P(u,[u.shape[1],u.shape[2],u.shape[3]]):u}var Mb=w({depthwiseConv2dNativeBackpropInput_:$F});function RF({x:r,filter:t,strides:e,pad:o,dataFormat:n="NHWC",dilations:s=[1,1],dimRoundingMode:a,bias:i,activation:c="linear",preluActivationWeights:p,leakyreluAlpha:l}){if(qn(v.state.gradientDepth,c)===!1){let k=ei(r,t,e,o,n,s,a);return i!=null&&(k=Et(k,i)),Kn(k,c,p,l)}let u=T(r,"x","depthwiseConv2d","float32"),m=T(t,"filter","depthwiseConv2d","float32"),f=u,d=!1;u.rank===3&&(d=!0,f=P(u,[1,u.shape[0],u.shape[1],u.shape[2]])),E(f.rank===4,()=>`Error in fused depthwiseConv2d: input must be rank 4, but got rank ${f.rank}.`),E(m.rank===4,()=>`Error in fused depthwiseConv2d: filter must be rank 4, but got rank ${m.rank}.`),E(f.shape[3]===m.shape[2],()=>`Error in fused depthwiseConv2d: number of input channels (${f.shape[3]}) must match the inChannels dimension in filter ${m.shape[2]}.`),s==null&&(s=[1,1]),E(de(e,s),()=>`Error in fused depthwiseConv2d: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`),Zt("fused depthwiseConv2d",o,a);let h=Pn(f.shape,m.shape,e,s,o,a,!0),g;i!=null&&(g=T(i,"bias","fused conv2d"),[g]=ft(g,u),Tt(h.outShape,g.shape));let x;p!=null&&(x=T(p,"prelu weights","fused depthwiseConv2d"));let b=(k,$)=>{E(On(s),()=>`Error in gradient of fused depthwiseConv2d: dilation rates greater than 1 are not yet supported. Got dilations '${s}'`);let[R,A,D,_]=$,O=Un(k,D,c),L=Mb(A.shape,O,R,e,o,s,a),B=Vb(A,O,R.shape,e,o,s,a);if(_!=null){let M=Hn(g,O);return[L,B,M]}return[L,B]},S={x:f,filter:m,bias:g,preluActivationWeights:x},N={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a,activation:c,leakyreluAlpha:l};return i==null?Ie(($,R,A)=>{let D=v.runKernel(Nn,S,N);return A([R,$,D]),d&&(D=P(D,[D.shape[1],D.shape[2],D.shape[3]])),{value:D,gradFunc:b}})(f,m):Ie(($,R,A,D)=>{let _=v.runKernel(Nn,S,N);return D([R,$,_,A]),d&&(_=P(_,[_.shape[1],_.shape[2],_.shape[3]])),{value:_,gradFunc:b}})(f,m,g)}var zb=w({fusedDepthwiseConv2d_:RF});function AF({a:r,b:t,transposeA:e=!1,transposeB:o=!1,bias:n,activation:s="linear",preluActivationWeights:a,leakyreluAlpha:i=.2}){if(qn(v.state.gradientDepth,s)===!1){let O=St(r,t,e,o);return n!=null&&(O=Et(O,n)),Kn(O,s,a,i)}let c=T(r,"a","fused matMul"),p=T(t,"b","fused matMul");[c,p]=ft(c,p);let l=e?c.shape[c.rank-2]:c.shape[c.rank-1],u=o?p.shape[p.rank-1]:p.shape[p.rank-2],m=e?c.shape[c.rank-1]:c.shape[c.rank-2],f=o?p.shape[p.rank-2]:p.shape[p.rank-1],d=c.shape.slice(0,-2),h=p.shape.slice(0,-2),g=xt(d),x=xt(h);E(l===u,()=>`Error in fused matMul: inner shapes (${l}) and (${u}) of Tensors with shapes ${c.shape} and ${p.shape} and transposeA=${e} and transposeB=${o} must match.`);let S=Tt(c.shape.slice(0,-2),p.shape.slice(0,-2)).concat([m,f]),N=e?P(c,[g,l,m]):P(c,[g,m,l]),k=o?P(p,[x,f,u]):P(p,[x,u,f]),$;n!=null&&($=T(n,"bias","fused matMul"),[$]=ft($,c),Tt(S,$.shape));let R;a!=null&&(R=T(a,"prelu weights","fused matMul"));let A=(O,L)=>{let[B,M,V,G]=L,U=Un(P(O,V.shape),V,s),z,H;if(!e&&!o?(z=St(U,M,!1,!0),H=St(B,U,!0,!1)):!e&&o?(z=St(U,M,!1,!1),H=St(U,B,!0,!1)):e&&!o?(z=St(M,U,!1,!0),H=St(B,U,!1,!1)):(z=St(M,U,!0,!0),H=St(U,B,!0,!0)),n!=null){let q=Hn(G,U);return[z,H,q]}else return[z,H]},D={a:N,b:k,bias:$,preluActivationWeights:R},_={transposeA:e,transposeB:o,activation:s,leakyreluAlpha:i};return n==null?Ie((L,B,M)=>{let V=v.runKernel(Sn,D,_);return M([L,B,V]),{value:P(V,S),gradFunc:A}})(N,k):Ie((L,B,M,V)=>{let G=v.runKernel(Sn,D,_);return V([L,B,G,M]),{value:P(G,S),gradFunc:A}})(N,k,$)}var Wb=w({fusedMatMul_:AF});function FF(r){return uc(r,.54,.46)}var Gb=w({hammingWindow_:FF});function DF(r){return uc(r,.5,.5)}var ll=w({hannWindow_:DF});function _F(r,t,e,o=!1,n=0){let s=0,a=[];for(;s+t<=r.size;)a.push(yt(r,s,t)),s+=e;if(o)for(;s<r.size;){let i=s+t-r.size,c=Dt([yt(r,s,t-i),fo([i],n)]);a.push(c),s+=e}return a.length===0?Co([],[0,t]):P(Dt(a),[a.length,t])}var ul=w({frame_:_F});function OF(r,t,e,o,n=ll){o==null&&(o=Qf(t));let s=ul(r,t,e),a=at(s,n(t));return ai(a,o)}var Ub=w({stft_:OF});function PF(r,t,e,o,n="bilinear",s=0){let a=T(r,"image","cropAndResize"),i=T(t,"boxes","cropAndResize","float32"),c=T(e,"boxInd","cropAndResize","int32"),p=i.shape[0];E(a.rank===4,()=>`Error in cropAndResize: image must be rank 4,but got rank ${a.rank}.`),E(i.rank===2&&i.shape[1]===4,()=>`Error in cropAndResize: boxes must be have size [${p},4] but had shape ${i.shape}.`),E(c.rank===1&&c.shape[0]===p,()=>`Error in cropAndResize: boxInd must be have size [${p}] but had shape ${i.shape}.`),E(o.length===2,()=>`Error in cropAndResize: cropSize must be of length 2, but got length ${o.length}.`),E(o[0]>=1&&o[1]>=1,()=>`cropSize must be atleast [1,1], but was ${o}`),E(n==="bilinear"||n==="nearest",()=>`method must be bilinear or nearest, but was ${n}`);let l={image:a,boxes:i,boxInd:c},u={method:n,extrapolationValue:s,cropSize:o};return v.runKernel(Fs,l,u)}var Hb=w({cropAndResize_:PF});function LF(r){let t=T(r,"image","flipLeftRight","float32");E(t.rank===4,()=>`Error in flipLeftRight: image must be rank 4,but got rank ${t.rank}.`);let e={image:t};return v.runKernel(Gs,e,{})}var Kb=w({flipLeftRight_:LF});function BF(r){let t=T(r,"image","grayscaleToRGB"),e=t.rank-1,o=t.shape[e];E(t.rank>=2,()=>`Error in grayscaleToRGB: images must be at least rank 2, but got rank ${t.rank}.`),E(o===1,()=>`Error in grayscaleToRGB: last dimension of a grayscale image should be size 1, but got size ${o}.`);let n=new Array(t.rank);return n.fill(1,0,e),n[e]=3,xo(t,n)}var qb=w({grayscaleToRGB_:BF});function VF(r,t,e=0,o=.5){let n=T(r,"image","rotateWithOffset","float32");E(n.rank===4,()=>`Error in rotateWithOffset: image must be rank 4,but got rank ${n.rank}.`);let s={image:n},a={radians:t,fillValue:e,center:o};return v.runKernel(Wa,s,a)}var Xb=w({rotateWithOffset_:VF});function Ze(r,t,e,o,n,s){o==null&&(o=.5),n==null&&(n=Number.NEGATIVE_INFINITY),s==null&&(s=0);let a=r.shape[0];return e=Math.min(e,a),E(0<=o&&o<=1,()=>`iouThreshold must be in [0, 1], but was '${o}'`),E(r.rank===2,()=>`boxes must be a 2D tensor, but was of rank '${r.rank}'`),E(r.shape[1]===4,()=>`boxes must have 4 columns, but 2nd dimension was ${r.shape[1]}`),E(t.rank===1,()=>"scores must be a 1D tensor"),E(t.shape[0]===a,()=>`scores has incompatible shape with boxes. Expected ${a}, but was ${t.shape[0]}`),E(0<=s&&s<=1,()=>`softNmsSigma must be in [0, 1], but was '${s}'`),{maxOutputSize:e,iouThreshold:o,scoreThreshold:n,softNmsSigma:s}}function MF(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY){let s=T(r,"boxes","nonMaxSuppression","float32"),a=T(t,"scores","nonMaxSuppression","float32"),i=Ze(s,a,e,o,n);e=i.maxOutputSize,o=i.iouThreshold,n=i.scoreThreshold;let c={maxOutputSize:e,iouThreshold:o,scoreThreshold:n};return v.runKernel(oa,{boxes:s,scores:a},c)}var jb=w({nonMaxSuppression_:MF});function Yb(r,t,e){let o=zF(r,t,e),n=o<0?-(o+1):o;r.splice(n,0,t)}function zF(r,t,e){return GF(r,t,e||WF)}function WF(r,t){return r>t?1:r<t?-1:0}function GF(r,t,e){let o=0,n=r.length,s=0,a=!1;for(;o<n;){s=o+(n-o>>>1);let i=e(t,r[s]);i>0?o=s+1:(n=s,a=!i)}return a?o:-o-1}function ml(r,t,e,o,n){return td(r,t,e,o,n,0)}function fl(r,t,e,o,n,s){return td(r,t,e,o,n,0,!1,s,!0)}function dl(r,t,e,o,n,s){return td(r,t,e,o,n,s,!0)}function td(r,t,e,o,n,s,a=!1,i=!1,c=!1){let p=[];for(let g=0;g<t.length;g++)t[g]>n&&p.push({score:t[g],boxIndex:g,suppressBeginIndex:0});p.sort(Zb);let l=s>0?-.5/s:0,u=[],m=[];for(;u.length<e&&p.length>0;){let g=p.pop(),{score:x,boxIndex:b,suppressBeginIndex:S}=g;if(x<n)break;let N=!1;for(let k=u.length-1;k>=S;--k){let $=UF(r,b,u[k]);if($>=o){N=!0;break}if(g.score=g.score*HF(o,l,$),g.score<=n)break}g.suppressBeginIndex=u.length,N||(g.score===x?(u.push(b),m.push(g.score)):g.score>n&&Yb(p,g,Zb))}let f=u.length,d=e-f;i&&d>0&&(u.push(...new Array(d).fill(0)),m.push(...new Array(d).fill(0)));let h={selectedIndices:u};return a&&(h.selectedScores=m),c&&(h.validOutputs=f),h}function UF(r,t,e){let o=r.subarray(t*4,t*4+4),n=r.subarray(e*4,e*4+4),s=Math.min(o[0],o[2]),a=Math.min(o[1],o[3]),i=Math.max(o[0],o[2]),c=Math.max(o[1],o[3]),p=Math.min(n[0],n[2]),l=Math.min(n[1],n[3]),u=Math.max(n[0],n[2]),m=Math.max(n[1],n[3]),f=(i-s)*(c-a),d=(u-p)*(m-l);if(f<=0||d<=0)return 0;let h=Math.max(s,p),g=Math.max(a,l),x=Math.min(i,u),b=Math.min(c,m),S=Math.max(x-h,0)*Math.max(b-g,0);return S/(f+d-S)}function HF(r,t,e){let o=Math.exp(t*e*e);return e<=r?o:0}function Zb(r,t){return r.score-t.score||r.score===t.score&&t.boxIndex-r.boxIndex}async function KF(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY){let s=T(r,"boxes","nonMaxSuppressionAsync"),a=T(t,"scores","nonMaxSuppressionAsync"),i=Ze(s,a,e,o,n);e=i.maxOutputSize,o=i.iouThreshold,n=i.scoreThreshold;let c=await Promise.all([s.data(),a.data()]),p=c[0],l=c[1],{selectedIndices:u}=ml(p,l,e,o,n);return s!==r&&s.dispose(),a!==t&&a.dispose(),he(u,"int32")}var Qb=KF;function qF(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=0){let a=T(r,"boxes","nonMaxSuppression"),i=T(t,"scores","nonMaxSuppression"),c=Ze(a,i,e,o,n,s);e=c.maxOutputSize,o=c.iouThreshold,n=c.scoreThreshold,s=c.softNmsSigma;let p={boxes:a,scores:i},l={maxOutputSize:e,iouThreshold:o,scoreThreshold:n,softNmsSigma:s},u=v.runKernel(sa,p,l);return{selectedIndices:u[0],selectedScores:u[1]}}var Jb=w({nonMaxSuppressionWithScore_:qF});async function XF(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=0){let a=T(r,"boxes","nonMaxSuppressionAsync"),i=T(t,"scores","nonMaxSuppressionAsync"),c=Ze(a,i,e,o,n,s);e=c.maxOutputSize,o=c.iouThreshold,n=c.scoreThreshold,s=c.softNmsSigma;let p=await Promise.all([a.data(),i.data()]),l=p[0],u=p[1],{selectedIndices:m,selectedScores:f}=dl(l,u,e,o,n,s);return a!==r&&a.dispose(),i!==t&&i.dispose(),{selectedIndices:he(m,"int32"),selectedScores:he(f)}}var t0=XF;function jF(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=!1){let a=T(r,"boxes","nonMaxSuppression"),i=T(t,"scores","nonMaxSuppression"),c=Ze(a,i,e,o,n,null),p=c.maxOutputSize,l=c.iouThreshold,u=c.scoreThreshold,m={boxes:a,scores:i},f={maxOutputSize:p,iouThreshold:l,scoreThreshold:u,padToMaxOutputSize:s},d=v.runKernel(na,m,f);return{selectedIndices:d[0],validOutputs:d[1]}}var e0=w({nonMaxSuppressionPadded_:jF});async function YF(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=!1){let a=T(r,"boxes","nonMaxSuppressionAsync"),i=T(t,"scores","nonMaxSuppressionAsync"),c=Ze(a,i,e,o,n,null),p=c.maxOutputSize,l=c.iouThreshold,u=c.scoreThreshold,[m,f]=await Promise.all([a.data(),i.data()]),{selectedIndices:d,validOutputs:h}=fl(m,f,p,l,u,s);return a!==r&&a.dispose(),i!==t&&i.dispose(),{selectedIndices:he(d,"int32"),validOutputs:lt(h,"int32")}}var r0=YF;function ZF(r,t,e=!1,o=!1){let n=T(r,"images","resizeBilinear");E(n.rank===3||n.rank===4,()=>`Error in resizeBilinear: x must be rank 3 or 4, but got rank ${n.rank}.`),E(t.length===2,()=>`Error in resizeBilinear: new shape must 2D, but got shape ${t}.`),E(o===!1||e===!1,()=>"Error in resizeBilinear: If halfPixelCenters is true, alignCorners must be false.");let s=n,a=!1;n.rank===3&&(a=!0,s=P(n,[1,n.shape[0],n.shape[1],n.shape[2]]));let[]=t,i={images:s},c={alignCorners:e,halfPixelCenters:o,size:t},p=v.runKernel(ya,i,c);return a?P(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var o0=w({resizeBilinear_:ZF});function QF(r,t,e=!1,o=!1){let n=T(r,"images","resizeNearestNeighbor");E(n.rank===3||n.rank===4,()=>`Error in resizeNearestNeighbor: x must be rank 3 or 4, but got rank ${n.rank}.`),E(t.length===2,()=>`Error in resizeNearestNeighbor: new shape must 2D, but got shape ${t}.`),E(n.dtype==="float32"||n.dtype==="int32",()=>"`images` must have `int32` or `float32` as dtype"),E(o===!1||e===!1,()=>"Error in resizeNearestNeighbor: If halfPixelCenters is true, alignCorners must be false.");let s=n,a=!1;n.rank===3&&(a=!0,s=P(n,[1,n.shape[0],n.shape[1],n.shape[2]]));let[]=t,i={images:s},c={alignCorners:e,halfPixelCenters:o,size:t},p=v.runKernel(xa,i,c);return a?P(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var n0=w({resizeNearestNeighbor_:QF});function JF(r,t="binary",e=!1,o=.5){let n=T(r,"image","threshold"),s=.2989,a=.587,i=.114,c=n.shape[0]*n.shape[1],p=at(he([o]),255),l,u,m,f;if(E(n.rank===3,()=>`Error in threshold: image must be rank 3,but got rank ${n.rank}.`),E(n.shape[2]===3||n.shape[2]===1,()=>`Error in threshold: image color channel must be equal to 3 or 1but got ${n.shape[2]}.`),E(n.dtype==="int32"||n.dtype==="float32",()=>`Error in dtype: image dtype must be int32 or float32,but got dtype ${n.dtype}.`),E(t==="otsu"||t==="binary",()=>`Method must be binary or otsu, but was ${t}`),n.shape[2]===3){[l,u,m]=Gr(n,[1,1,1],-1);let g=at(l,s),x=at(u,a),b=at(m,i);f=Et(Et(g,x),b)}else f=r;if(t==="otsu"){let g=vp(kt(ol(f),"int32"),me([]),256);p=tD(g,c)}let d=e?ni(f,p):Bn(f,p);return kt(at(d,255),"int32")}function tD(r,t){let e=he([-1]),o=he([0]),n=he([0]),s,a,i,c,p,l;for(let u=0;u<r.size-1;u++){s=yt(r,0,u+1),a=yt(r,u+1),p=Ut(wt(s),t),l=Ut(wt(a),t);let m=wt(at(s,yo(0,s.size)));i=Ut(m,wt(s));let f=fo(a.shape,s.size),d=Et(yo(0,a.size),f),h=at(a,d);c=Ut(wt(h),wt(a));let g=ut(i,c),x=ut(i,c),b=at(p,l);n=at(at(b,g),x);let S=Bn(n,o);o=mr(S,n,o),e=mr(S,he([u]),e)}return e}var s0=w({threshold_:JF});function eD(r,t,e="nearest",o="constant",n=0,s){let a=T(r,"image","transform","float32"),i=T(t,"transforms","transform","float32");E(a.rank===4,()=>`Error in transform: image must be rank 4,but got rank ${a.rank}.`),E(i.rank===2&&(i.shape[0]===a.shape[0]||i.shape[0]===1)&&i.shape[1]===8,()=>"Error in transform: Input transform should be batch x 8 or 1 x 8"),E(s==null||s.length===2,()=>`Error in transform: outputShape must be [height, width] or null, but got ${s}.`);let c={image:a,transforms:i},p={interpolation:e,fillMode:o,fillValue:n,outputShape:s};return v.runKernel(La,c,p)}var a0=w({transform_:eD});function rD(r,t,e){E(t%1===0,()=>`bandPart(): numLower must be an integer, got ${t}.`),E(e%1===0,()=>`bandPart(): numUpper must be an integer, got ${e}.`);let o=T(r,"a","bandPart");E(o.rank>=2,()=>`bandPart(): Rank must be at least 2, got ${o.rank}.`);let n=o.shape,[s,a]=o.shape.slice(-2);if(!(t<=s))throw new Error(`bandPart(): numLower (${t}) must not be greater than the number of rows (${s}).`);if(!(e<=a))throw new Error(`bandPart(): numUpper (${e}) must not be greater than the number of columns (${a}).`);t<0&&(t=s),e<0&&(e=a);let i=P(yo(0,s,1,"int32"),[-1,1]),c=yo(0,a,1,"int32"),p=ut(i,c),l=Vn(ni(p,lt(+t,"int32")),Pp(p,lt(-e,"int32"))),u=Ye([s,a],o.dtype);return P(Ce(Ve(P(o,[-1,s,a])).map(m=>mr(l,m,u))),n)}var i0=w({bandPart_:rD});function oD(r){let t;if(Array.isArray(r)){t=!1,E(r!=null&&r.length>0,()=>"Gram-Schmidt process: input must not be null, undefined, or empty");let n=r[0].shape[0];for(let s=1;s<r.length;++s)E(r[s].shape[0]===n,()=>`Gram-Schmidt: Non-unique lengths found in the input vectors: (${r[s].shape[0]} vs. ${n})`)}else t=!0,r=Gr(r,r.shape[0],0).map(n=>ii(n,[0]));E(r.length<=r[0].shape[0],()=>`Gram-Schmidt: Number of vectors (${r.length}) exceeds number of dimensions (${r[0].shape[0]}).`);let e=[],o=r;for(let n=0;n<r.length;++n)e.push(v.tidy(()=>{let s=o[n];if(n>0)for(let a=0;a<n;++a){let i=at(wt(at(e[a],s)),e[a]);s=ut(s,i)}return Ut(s,Ln(s,"euclidean"))}));return t?Ce(e,0):e}var c0=w({gramSchmidt_:oD});function nD(r,t=!1){if(E(r.rank>=2,()=>`qr() requires input tensor to have a rank >= 2, but got rank ${r.rank}`),r.rank===2)return p0(r,t);{let e=r.shape.slice(0,r.shape.length-2).reduce((c,p)=>c*p),o=Ve(P(r,[e,r.shape[r.shape.length-2],r.shape[r.shape.length-1]]),0),n=[],s=[];o.forEach(c=>{let[p,l]=p0(c,t);n.push(p),s.push(l)});let a=P(Ce(n,0),r.shape),i=P(Ce(s,0),r.shape);return[a,i]}}function p0(r,t=!1){return v.tidy(()=>{E(r.shape.length===2,()=>`qr2d() requires a 2D Tensor, but got a ${r.shape.length}D Tensor.`);let e=r.shape[0],o=r.shape[1],n=Dp(e),s=Ae(r),a=Co([[1]],[1,1]),i=Ae(a),c=e>=o?o:e;for(let p=0;p<c;++p){let l=s,u=i,m=n;[i,s,n]=v.tidy(()=>{let f=yt(s,[p,p],[e-p,1]),d=Ln(f),h=yt(s,[p,p],[1,1]),g=mr(Bn(h,0),Co([[-1]]),Co([[1]])),x=ut(h,at(g,d)),b=Ut(f,x);b.shape[0]===1?i=Ae(a):i=Dt([a,yt(b,[1,0],[b.shape[0]-1,b.shape[1]])],0);let S=be(Ut(St(g,x),d)),N=yt(s,[p,0],[e-p,o]),k=at(S,i),$=yp(i);if(p===0)s=ut(N,St(k,St($,N)));else{let D=ut(N,St(k,St($,N)));s=Dt([yt(s,[0,0],[p,o]),D],0)}let R=yp(k),A=yt(n,[0,p],[e,n.shape[1]-p]);if(p===0)n=ut(A,St(St(A,i),R));else{let D=ut(A,St(St(A,i),R));n=Dt([yt(n,[0,0],[e,p]),D],1)}return[i,s,n]}),Bf([l,u,m])}return!t&&e>o&&(n=yt(n,[0,0],[e,o]),s=yt(s,[0,0],[o,o])),[n,s]})}var l0=w({qr_:nD});var Xt;(function(r){r[r.NONE=0]="NONE",r[r.MEAN=1]="MEAN",r[r.SUM=2]="SUM",r[r.SUM_BY_NONZERO_WEIGHTS=3]="SUM_BY_NONZERO_WEIGHTS"})(Xt||(Xt={}));function sD(r,t,e=Xt.SUM_BY_NONZERO_WEIGHTS){let o=T(r,"losses","computeWeightedLoss"),n=null;t!=null&&(n=T(t,"weights","computeWeightedLoss"));let s=n==null?o:at(o,n);if(e===Xt.NONE)return s;if(e===Xt.SUM)return wt(s);if(e===Xt.MEAN){if(n==null)return Mn(s);{let a=o.size/n.size,i=Ut(wt(s),wt(n));return a>1?Ut(i,lt(a)):i}}if(e===Xt.SUM_BY_NONZERO_WEIGHTS){if(n==null)return Ut(wt(s),lt(o.size));{let a=at(n,Ir(o.shape)),i=kt(wt(qp(a,lt(0))),"float32");return Ut(wt(s),i)}}throw Error(`Unknown reduction: ${e}`)}var ce=w({computeWeightedLoss_:sD});function aD(r,t,e,o=Xt.SUM_BY_NONZERO_WEIGHTS){let n=T(r,"labels","absoluteDifference"),s=T(t,"predictions","absoluteDifference"),a=null;e!=null&&(a=T(e,"weights","absoluteDifference")),qt(n.shape,s.shape,"Error in absoluteDifference: ");let i=fe(ut(n,s));return ce(i,a,o)}var u0=w({absoluteDifference_:aD});function iD(r,t,e,o,n=Xt.SUM_BY_NONZERO_WEIGHTS){let s=T(r,"labels","cosineDistance"),a=T(t,"predictions","cosineDistance"),i=null;o!=null&&(i=T(o,"weights","cosineDistance")),qt(s.shape,a.shape,"Error in cosineDistance: ");let c=lt(1),p=ut(c,wt(at(s,a),e,!0));return ce(p,i,n)}var m0=w({cosineDistance_:iD});function cD(r,t,e,o=Xt.SUM_BY_NONZERO_WEIGHTS){let n=T(r,"labels","hingeLoss"),s=T(t,"predictions","hingeLoss"),a=null;e!=null&&(a=T(e,"weights","hingeLoss")),qt(n.shape,s.shape,"Error in hingeLoss: ");let i=lt(1);n=ut(at(lt(2),n),i);let c=bo(ut(i,at(n,s)));return ce(c,a,o)}var f0=w({hingeLoss_:cD});function pD(r,t,e,o=1,n=Xt.SUM_BY_NONZERO_WEIGHTS){let s=T(r,"labels","huberLoss"),a=T(t,"predictions","huberLoss"),i=null;e!=null&&(i=T(e,"weights","huberLoss")),qt(s.shape,a.shape,"Error in huberLoss: ");let c=lt(o),p=fe(ut(a,s)),l=Kp(p,c),u=ut(p,l),m=Et(at(lt(.5),go(l)),at(c,u));return ce(m,i,n)}var d0=w({huberLoss_:pD});function lD(r,t,e,o=1e-7,n=Xt.SUM_BY_NONZERO_WEIGHTS){let s=T(r,"labels","logLoss"),a=T(t,"predictions","logLoss"),i=null;e!=null&&(i=T(e,"weights","logLoss")),qt(s.shape,a.shape,"Error in logLoss: ");let c=lt(1),p=lt(o),l=be(at(s,Wr(Et(a,p)))),u=at(ut(c,s),Wr(Et(ut(c,a),p))),m=ut(l,u);return ce(m,i,n)}var h0=w({logLoss_:lD});function uD(r,t,e,o=Xt.SUM_BY_NONZERO_WEIGHTS){let n=T(r,"labels","meanSquaredError"),s=T(t,"predictions","meanSquaredError"),a=null;e!=null&&(a=T(e,"weights","meanSquaredError")),qt(n.shape,s.shape,"Error in meanSquaredError: ");let i=al(n,s);return ce(i,a,o)}var g0=w({meanSquaredError_:uD});function mD(r,t){let e=T(r,"labels","sigmoidCrossEntropyWithLogits"),o=T(t,"logits","sigmoidCrossEntropyWithLogits");qt(e.shape,o.shape,"Error in sigmoidCrossEntropyWithLogits: ");let n=bo(o),s=at(o,e),a=Vp(je(be(fe(o))));return Et(ut(n,s),a)}function fD(r,t,e,o=0,n=Xt.SUM_BY_NONZERO_WEIGHTS){let s=T(r,"multiClassLabels","sigmoidCrossEntropy"),a=T(t,"logits","sigmoidCrossEntropy"),i=null;if(e!=null&&(i=T(e,"weights","sigmoidCrossEntropy")),qt(s.shape,a.shape,"Error in sigmoidCrossEntropy: "),o>0){let p=lt(o),l=lt(1),u=lt(.5);s=Et(at(s,ut(l,p)),at(u,p))}let c=mD(s,a);return ce(c,i,n)}var x0=w({sigmoidCrossEntropy_:fD});function dD(r,t,e=-1){if(e===-1&&(e=t.rank-1),e!==t.rank-1)throw Error(`Softmax cross entropy along a non-last dimension is not yet supported. Labels / logits was rank ${t.rank} and dim was ${e}`);return Ie((n,s,a)=>{let c=zp(s,[e],!0),p=ut(kt(s,"float32"),c);a([n,p]);let l=be(at(p,n));return{value:wt(l,[e]),gradFunc:(f,d)=>{let[h,g]=d,x=Mr(f.shape,[e]);return[at(P(f,x),ut(kt(h,"float32"),je(g))),at(P(f,x),ut(je(g),kt(h,"float32")))]}}})(r,t)}function hD(r,t,e,o=0,n=Xt.SUM_BY_NONZERO_WEIGHTS){let s=T(r,"onehotLabels","softmaxCrossEntropy"),a=T(t,"logits","softmaxCrossEntropy"),i=null;if(e!=null&&(i=T(e,"weights","softmaxCrossEntropy")),qt(s.shape,a.shape,"Error in softmaxCrossEntropy: "),o>0){let p=lt(o),l=lt(1),u=lt(s.shape[1]);s=Et(at(s,ut(l,p)),Ut(p,u))}let c=dD(s,a);return ce(c,i,n)}var y0=w({softmaxCrossEntropy_:hD});function gD(r,t,e,o){let n=T(r,"indices","sparseFillEmptyRows","int32"),s=T(t,"values","sparseFillEmptyRows"),a=T(e,"denseShape","sparseFillEmptyRows","int32"),i=T(o,"defaultValue","sparseFillEmptyRows",s.dtype);if(n.rank!==2)throw new Error(`Indices should be Tensor2D but received shape
        ${n.shape}`);if(s.rank!==1)throw new Error(`Values should be Tensor1D but received shape ${s.shape}`);if(a.rank!==1)throw new Error(`Dense shape should be Tensor1D but received shape ${a.shape}`);if(i.rank!==0)throw new Error(`Default value should be a scalar but received shape ${i.shape}`);let c={indices:n,values:s,denseShape:a,defaultValue:i},p=v.runKernel(ka,c);return{outputIndices:p[0],outputValues:p[1],emptyRowIndicator:p[2],reverseIndexMap:p[3]}}var b0=w({sparseFillEmptyRows_:gD});function xD(r,t,e){let o=T(r,"inputIndices","sparseReshape","int32"),n=T(t,"inputShape","sparseReshape","int32"),s=T(e,"newShape","sparseReshape","int32");if(o.rank!==2)throw new Error(`Input indices should be Tensor2D but received shape
        ${o.shape}`);if(n.rank!==1)throw new Error(`Input shape should be Tensor1D but received shape ${n.shape}`);if(s.rank!==1)throw new Error(`New shape should be Tensor1D but received shape ${s.shape}`);let a={inputIndices:o,inputShape:n,newShape:s},i=v.runKernel(Ea,a);return{outputIndices:i[0],outputShape:i[1]}}var C0=w({sparseReshape_:xD});function yD(r,t,e){let o=T(r,"data","sparseSegmentMean"),n=T(t,"indices","sparseSegmentMean","int32"),s=T(e,"segmentIds","sparseSegmentMean","int32");if(o.rank<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.rank!==1)throw new Error(`Indices should be Tensor1D but received shape
          ${n.shape}`);if(s.rank!==1)throw new Error(`Segment ids should be Tensor1D but received shape
          ${s.shape}`);let a={data:o,indices:n,segmentIds:s};return v.runKernel($a,a)}var T0=w({sparseSegmentMean_:yD});function bD(r,t,e){let o=T(r,"data","sparseSegmentSum"),n=T(t,"indices","sparseSegmentSum","int32"),s=T(e,"segmentIds","sparseSegmentSum","int32");if(o.rank<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.rank!==1)throw new Error(`Indices should be Tensor1D but received shape
         ${n.shape}`);if(s.rank!==1)throw new Error(`Segment ids should be Tensor1D but received shape
         ${s.shape}`);let a={data:o,indices:n,segmentIds:s};return v.runKernel(Ra,a)}var S0=w({sparseSegmentSum_:bD});function CD(r,t,e,o,n,s,a,i){let c=T(r,"data","stringNGrams","string");if(c.dtype!=="string")throw new Error("Data must be of datatype string");if(c.shape.length!==1)throw new Error(`Data must be a vector, saw: ${c.shape}`);let p=T(t,"dataSplits","stringNGrams");if(p.dtype!=="int32")throw new Error("Data splits must be of datatype int32");let l={separator:e,nGramWidths:o,leftPad:n,rightPad:s,padWidth:a,preserveShortSequences:i},u={data:c,dataSplits:p},m=v.runKernel(Da,u,l);return{nGrams:m[0],nGramsSplits:m[1]}}var w0=w({stringNGrams_:CD});function TD(r,t,e=!0){let o=T(r,"input","stringSplit","string"),n=T(t,"delimiter","stringSplit","string");if(o.rank!==1)throw new Error(`Input should be Tensor1D but received shape ${o.shape}`);if(n.rank!==0)throw new Error(`Delimiter should be a scalar but received shape ${n.shape}`);let s={skipEmpty:e},a={input:o,delimiter:n},i=v.runKernel(_a,a,s);return{indices:i[0],values:i[1],shape:i[2]}}var N0=w({stringSplit_:TD});function SD(r,t){let e=T(r,"input","stringToHashBucketFast","string"),o={numBuckets:t};if(t<=0)throw new Error("Number of buckets must be at least 1");let n={input:e};return v.runKernel(Oa,n,o)}var I0=w({stringToHashBucketFast_:SD});var wD={fft:si,ifft:Gn,rfft:ai,irfft:sl},ND={hammingWindow:Gb,hannWindow:ll,frame:ul,stft:Ub},ID={flipLeftRight:Kb,grayscaleToRGB:qb,resizeNearestNeighbor:n0,resizeBilinear:o0,rotateWithOffset:Xb,cropAndResize:Hb,nonMaxSuppression:jb,nonMaxSuppressionAsync:Qb,nonMaxSuppressionWithScore:Jb,nonMaxSuppressionWithScoreAsync:t0,nonMaxSuppressionPadded:e0,nonMaxSuppressionPaddedAsync:r0,threshold:s0,transform:a0},vD={bandPart:i0,gramSchmidt:c0,qr:l0},kD={absoluteDifference:u0,computeWeightedLoss:ce,cosineDistance:m0,hingeLoss:f0,huberLoss:d0,logLoss:h0,meanSquaredError:g0,sigmoidCrossEntropy:x0,softmaxCrossEntropy:y0},ED={sparseFillEmptyRows:b0,sparseReshape:C0,sparseSegmentMean:T0,sparseSegmentSum:S0},$D={stringNGrams:w0,stringSplit:N0,stringToHashBucketFast:I0};var RD=typeof requestAnimationFrame<"u"?requestAnimationFrame:typeof setImmediate<"u"?setImmediate:r=>r();function ed(){return new Promise(r=>RD(()=>r()))}var I={};At(I,{ERF_A1:()=>qD,ERF_A2:()=>XD,ERF_A3:()=>jD,ERF_A4:()=>YD,ERF_A5:()=>ZD,ERF_P:()=>KD,PARALLELIZE_THRESHOLD:()=>hl,RowPartitionType:()=>kr,SELU_SCALE:()=>HD,SELU_SCALEALPHA:()=>UD,applyActivation:()=>Kn,assertAndGetBroadcastShape:()=>Tt,assertAxesAreInnerMostDims:()=>rR,assertParamsConsistent:()=>AD,assignToTypedArray:()=>o_,axesAreInnerMostDims:()=>Uf,calculateShapes:()=>E$,checkEinsumDimSizes:()=>p_,checkPadOnDimRoundingMode:()=>Zt,combineLocations:()=>py,combineRaggedTensorToTensorShapes:()=>DD,complexWithEvenIndex:()=>t_,complexWithOddIndex:()=>e_,computeConv2DInfo:()=>Pn,computeConv3DInfo:()=>Ax,computeDefaultPad:()=>Gf,computeDilation2DInfo:()=>o2,computeOptimalWindowSize:()=>LD,computeOutAndReduceShapes:()=>eR,computeOutShape:()=>FD,computePool2DInfo:()=>Wf,computePool3DInfo:()=>n2,convertConv2DDataFormat:()=>Fx,decodeEinsumEquation:()=>i_,eitherStridesOrDilationsAreOne:()=>de,expandShapeToKeepDim:()=>Mr,exponent:()=>s_,exponents:()=>n_,fromStringArrayToUint8:()=>R_,fromUint8ToStringArray:()=>$_,getAxesPermutation:()=>oR,getBroadcastDims:()=>ix,getComplexWithIndex:()=>r_,getEinsumComputePath:()=>l_,getEinsumPermutation:()=>c_,getFusedBiasGradient:()=>Hn,getFusedDyActivation:()=>Un,getImageCenter:()=>BD,getInnerMostAxes:()=>sR,getPermuted:()=>MD,getRaggedRank:()=>OD,getReductionAxes:()=>bp,getReshaped:()=>VD,getReshapedPermuted:()=>zD,getRowPartitionTypesHelper:()=>_D,getSliceBeginCoords:()=>WD,getSliceSize:()=>GD,getSparseFillEmptyRowsIndicesDenseShapeMismatch:()=>d_,getSparseFillEmptyRowsNegativeIndexErrorMessage:()=>h_,getSparseFillEmptyRowsOutOfRangeIndexErrorMessage:()=>g_,getSparseReshapeEmptyTensorZeroOutputDimErrorMessage:()=>b_,getSparseReshapeInputOutputMismatchErrorMessage:()=>T_,getSparseReshapeInputOutputMultipleErrorMessage:()=>C_,getSparseReshapeMultipleNegativeOneOutputDimErrorMessage:()=>x_,getSparseReshapeNegativeOutputDimErrorMessage:()=>y_,getSparseSegmentReductionIndicesOutOfRangeErrorMessage:()=>I_,getSparseSegmentReductionNegativeSegmentIdsErrorMessage:()=>S_,getSparseSegmentReductionNonIncreasingSegmentIdsErrorMessage:()=>w_,getSparseSegmentReductionSegmentIdOutOfRangeErrorMessage:()=>N_,getUndoAxesPermutation:()=>nR,isIdentityPermutation:()=>u_,log:()=>TE,mergeRealAndImagArrays:()=>QD,prepareAndValidate:()=>k$,prepareSplitSize:()=>f_,segment_util:()=>od,shouldFuse:()=>qn,slice_util:()=>ne,splitRealAndImagArrays:()=>JD,tupleValuesAreOne:()=>On,upcastType:()=>Yt,validateDefaultValueShape:()=>PD,validateInput:()=>Vf,validateUpdateShape:()=>px,warn:()=>Lr});function AD(r,t){let e=r[0].length;r.forEach((n,s)=>{E(n.length===e,()=>`Error in concat${e}D: rank of tensors[${s}] must be the same as the rank of the rest (${e})`)}),E(t>=0&&t<e,()=>`Error in concat${e}D: axis must be between 0 and ${e-1}.`);let o=r[0];r.forEach((n,s)=>{for(let a=0;a<e;a++)E(a===t||n[a]===o[a],()=>`Error in concat${e}D: Shape of tensors[${s}] (${n}) does not match the shape of the rest (${o}) along the non-concatenated axis ${s}.`)})}function FD(r,t){let e=r[0].slice();for(let o=1;o<r.length;o++)e[t]+=r[o][t];return e}var kr;(function(r){r[r.FIRST_DIM_SIZE=0]="FIRST_DIM_SIZE",r[r.VALUE_ROWIDS=1]="VALUE_ROWIDS",r[r.ROW_LENGTHS=2]="ROW_LENGTHS",r[r.ROW_SPLITS=3]="ROW_SPLITS",r[r.ROW_LIMITS=4]="ROW_LIMITS",r[r.ROW_STARTS=5]="ROW_STARTS"})(kr||(kr={}));function DD(r,t,e){let o=new Array;if(e==null&&t==null)return o;if(t==null)for(;o.length<r+e.length;)o.push(-1);else o=t.slice();if(e==null)return o;if(r+e.length!==o.length)throw new Error(`rt input.shape and shape=${t} are incompatible: rt input.rank = ${r+e.length}, but shape.rank = ${o.length}`);for(let n=1;n<e.length;++n){let s=e[n],a=o[o.length-e.length+n],i=o[a];if(s>=0)if(i>=0){if(i!==s)throw new Error(`rt input.shape and shape=${t} are incompatible: rt input.shape[${n+r}] = ${s} but shape[${n+r}] = ${i}`)}else o[a]=s}return o}function _D(r){let t={FIRST_DIM_SIZE:kr.FIRST_DIM_SIZE,VALUE_ROWIDS:kr.VALUE_ROWIDS,ROW_LENGTHS:kr.ROW_LENGTHS,ROW_SPLITS:kr.ROW_SPLITS,ROW_LIMITS:kr.ROW_LIMITS,ROW_STARTS:kr.ROW_STARTS},e=[];for(let o of r)if(o in t)e.push(t[o]);else break;return e}function OD(r){return r.length===0?0:r[0]===kr.FIRST_DIM_SIZE?r.length-1:r.length}function PD(r,t){if(r==null||t==null)return;let e=r.length,o=t.length;if(e>=o)throw new Error(`defaultValue.shape=${r} and ragged tensor flatValues.shape=${t}, are incompatible: defaultValue.rank = ${e} must be less than ragged tensor input flatValues.rank = ${o})`);for(let n=0;n<Math.min(e,o-1);++n){let s=r[n],a=t[n+1];if(s>=0&&a>=0&&s!==1&&s!==a)throw new Error(`defaultValue.shape=${r}, and ragged tensor input flatValues.shape=${t} are incompatible: defaultValue.shape[${n-r.length}] = ${s} but ragged tensor input.flatValues.shape[${n-r.length}] = ${a}`)}}var hl=30;function LD(r){return r<=hl?r:us(r,Math.floor(Math.sqrt(r)))}function BD(r,t,e){let o=e*(typeof r=="number"?r:r[0]),n=t*(typeof r=="number"?r:r[1]);return[o,n]}function VD(r,t,e,o=!0){let n=[];if(o)n=n.concat(t.slice(0)),n.push(r[0]/e),n=n.concat(r.slice(1));else{n=n.concat(r[0]);let s=t.length;for(let a=0;a<s;++a)n=n.concat([r[a+1]/t[a],t[a]]);n=n.concat(r.slice(s+1))}return n}function MD(r,t,e=!0){let o=[];if(e){o.push(t);for(let n=t+1;n<r;++n)n<=2*t?(o.push(n),o.push(n-(t+1))):o.push(n)}else{let n=[],s=[];for(let a=1;a<r;++a)a>=t*2+1||a%2===1?s.push(a):n.push(a);o.push(...n),o.push(0),o.push(...s)}return o}function zD(r,t,e,o=!0){let n=[];o?n.push(r[0]/e):n.push(r[0]*e);for(let s=1;s<r.length;++s)s<=t.length?o?n.push(t[s-1]*r[s]):n.push(r[s]/t[s-1]):n.push(r[s]);return n}function WD(r,t){let e=[0];for(let o=0;o<t;++o)e.push(r[o][0]);return e}function GD(r,t,e){let o=r.slice(0,1);for(let n=0;n<e;++n)o.push(r[n+1]-t[n][0]-t[n][1]);return o}var UD=1.7580993408473768,HD=1.0507009873554805;var KD=.3275911,qD=.254829592,XD=-.284496736,jD=1.421413741,YD=-1.453152027,ZD=1.061405429;function QD(r,t){if(r.length!==t.length)throw new Error(`Cannot merge real and imag arrays of different lengths. real:${r.length}, imag: ${t.length}.`);let e=new Float32Array(r.length*2);for(let o=0;o<e.length;o+=2)e[o]=r[o/2],e[o+1]=t[o/2];return e}function JD(r){let t=new Float32Array(r.length/2),e=new Float32Array(r.length/2);for(let o=0;o<r.length;o+=2)t[o/2]=r[o],e[o/2]=r[o+1];return{real:t,imag:e}}function t_(r){let t=Math.ceil(r.length/4),e=new Float32Array(t),o=new Float32Array(t);for(let n=0;n<r.length;n+=4)e[Math.floor(n/4)]=r[n],o[Math.floor(n/4)]=r[n+1];return{real:e,imag:o}}function e_(r){let t=Math.floor(r.length/4),e=new Float32Array(t),o=new Float32Array(t);for(let n=2;n<r.length;n+=4)e[Math.floor(n/4)]=r[n],o[Math.floor(n/4)]=r[n+1];return{real:e,imag:o}}function r_(r,t){let e=r[t*2],o=r[t*2+1];return{real:e,imag:o}}function o_(r,t,e,o){r[o*2]=t,r[o*2+1]=e}function n_(r,t){let e=new Float32Array(r/2),o=new Float32Array(r/2);for(let n=0;n<Math.ceil(r/2);n++){let s=(t?2:-2)*Math.PI*(n/r);e[n]=Math.cos(s),o[n]=Math.sin(s)}return{real:e,imag:o}}function s_(r,t,e){let o=(e?2:-2)*Math.PI*(r/t),n=Math.cos(o),s=Math.sin(o);return{real:n,imag:s}}var rd="->",a_=/->/g,v0=",",k0="...";function i_(r,t){r=r.replace(/\s/g,"");let e=(r.length-r.replace(a_,"").length)/rd.length;if(e<1)throw new Error("Equations without an arrow are not supported.");if(e>1)throw new Error(`Equation must contain exactly one arrow ("${rd}").`);let[o,n]=r.split(rd);E(o.indexOf(k0)===-1,()=>`The ellipsis notation ("${k0}") is not supported yet.`);let s=o.split(v0),a=s.length;if(t!==a)throw new Error(`Expected ${a} input tensors, received ${t}`);if(a>2)throw new Error("Support for more than 2 input tensors is not implemented yet.");let i=[];for(let m=0;m<n.length;++m){let f=n[m];if(!s.some(d=>d.indexOf(f)!==-1))throw new Error(`Output subscripts contain the label ${f} not present in the input subscripts.`);i.indexOf(f)===-1&&i.push(f)}for(let m=0;m<o.length;++m){let f=o[m];i.indexOf(f)===-1&&f!==v0&&i.push(f)}let c=new Array(s.length);for(let m=0;m<a;++m){if(new Set(s[m].split("")).size!==s[m].length)throw new Error(`Found duplicate axes in input component ${s[m]}. Support for duplicate axes in input is not implemented yet.`);c[m]=[];for(let f=0;f<s[m].length;++f)c[m].push(i.indexOf(s[m][f]))}let p=i.length,l=n.length,u=[];for(let m=l;m<p;++m)u.push(m);return{allDims:i,summedDims:u,idDims:c}}function c_(r,t){let e=new Array(r);e.fill(-1);for(let n=0;n<t.length;++n)e[t[n]]=n;let o=[];for(let n=0;n<r;++n)e[n]===-1&&o.push(n);return e=e.filter(n=>n!==-1),{permutationIndices:e,expandDims:o}}function p_(r,t,e){let o=new Array(r);for(let n=0;n<e.length;++n){let s=e[n].shape;for(let a=0;a<t[n].length;++a)o[t[n][a]]===void 0?o[t[n][a]]=s[a]:E(o[t[n][a]]===s[a],()=>`Expected dimension ${o[t[n][a]]} at axis ${a} of input shaped ${JSON.stringify(s)}, but got dimension ${s[a]}`)}}function l_(r,t){let e=r,o=[],n=0;r.length===0&&e.push(-1),n=r.length+1;for(let a=0;a<n;++a)o.push([]);let s=[];for(let a=0;a<e.length;++a){let i=e[a],c=m_(t,i);for(let p of c)s.indexOf(p)===-1&&(o[a].push(p),s.push(p))}return{path:e,steps:o}}function u_(r){return r.every((t,e)=>t===e)}function m_(r,t){let e=[];for(let o=0;o<r.length;++o)(r[o].length===0||r[o].indexOf(t)!==-1||t===-1)&&e.push(o);return e}function f_(r,t,e=0){let o=[];if(typeof t=="number")E(r.shape[e]%t===0,()=>"Number of splits must evenly divide the axis."),o=new Array(t).fill(r.shape[e]/t);else{let n=t.reduce((a,i)=>(i===-1&&(a+=1),a),0);E(n<=1,()=>"There should be only one negative value in split array.");let s=t.indexOf(-1);if(s!==-1){let a=t.reduce((i,c)=>c>0?i+c:i);t[s]=r.shape[e]-a}E(r.shape[e]===t.reduce((a,i)=>a+i),()=>"The sum of sizes must match the size of the axis dimension."),o=t}return o}function d_(r){return`Received SparseTensor with denseShape[0] = 0 but
  indices.shape[0] = ${r}`}function h_(r,t){return`indices(${r}, 0) is invalid: ${t} < 0`}function g_(r,t,e){return`indices(${r}, 0) is invalid: ${t} >= ${e}`}function x_(r,t){return`only one output dimension may be -1, not both ${r} and ${t}`}function y_(r,t){return`size ${r} must be non-negative, not ${t}`}function b_(){return"reshape cannot infer the missing input size for an empty tensor unless all specified input sizes are non-zero"}function C_(r,t){let e=xt(r),o=xt(t);return`Input to reshape is a SparseTensor with ${e}
  dense values, but the requested shape requires a multiple of ${o}. inputShape=${r} outputShape= ${t}`}function T_(r,t){let e=xt(r),o=xt(t);return`Input to reshape is a tensor with ${e} dense values, but the requested shape has ${o}. inputShape=${r} outputShape=${t}`}function S_(){return"segment ids must be >= 0"}function w_(){return"segment ids are not increasing"}function N_(r,t){return`Segment id ${r} out of range [0, ${t}), possibly because segmentIds input is not sorted.`}function I_(r,t,e){return`Bad: indices[${r}] == ${t} out of range [0, ${e})`}var od={};At(od,{collectGatherOpShapeInfo:()=>E_,computeOutShape:()=>k_,segOpComputeOptimalWindowSize:()=>v_});function v_(r,t){let e=!1,o;for(r<=hl?(o=r,e=!0):o=us(r,Math.floor(Math.sqrt(r)));!e;)o>t||o===r?e=!0:o=us(r,o+1);return o}function k_(r,t,e){let o=[],n=r.length;for(let s=0;s<n;s++)s!==t?o.push(r[s]):o.push(e);return o}function E_(r,t,e,o){let n=t.shape.length,s=r.shape.length;if(o!==0&&(o<-n||o>n))throw new Error(`Expect batchDims in the range of [-${n}, ${n}], but got ${o}`);if(o<0&&(o+=n),o>s)throw new Error(`batchDims (${o}) must be less than rank(x) (
    ${s}).`);if(e<o)throw new Error(`batchDims (${o}) must be less than or equal to axis (${e}).`);for(let u=0;u<o;++u)if(r.shape[u]!==t.shape[u])throw new Error(`x.shape[${u}]: ${r.shape[u]} should be equal to indices.shape[${u}]: ${t.shape[u]}.`);let a=r.shape[e],i=[],c=1,p=1,l=1;for(let u=0;u<o;++u)i.push(r.shape[u]),c*=r.shape[u];for(let u=o;u<e;u++)i.push(r.shape[u]),p*=r.shape[u];for(let u=o;u<n;u++)i.push(t.shape[u]);for(let u=e+1;u<s;u++)i.push(r.shape[u]),l*=r.shape[u];return{batchSize:c,sliceSize:l,outerSize:p,dimSize:a,outputShape:i}}function $_(r){try{return r.map(t=>qa(t))}catch(t){throw new Error(`Failed to decode encoded string bytes into utf-8, error: ${t}`)}}function R_(r){return r.map(t=>Ka(t))}var pe={};At(pe,{nonMaxSuppressionV3Impl:()=>ml,nonMaxSuppressionV4Impl:()=>fl,nonMaxSuppressionV5Impl:()=>dl,whereImpl:()=>cl});function W(r,t){Array.isArray(r)||(r=[r]),r.forEach(e=>{e!=null&&y.assert(e.dtype!=="complex64",()=>`${t} does not support complex64 tensors in the CPU backend.`)})}var A_=pe.whereImpl,mc=class r extends Or{constructor(){super(),this.blockSize=48,this.firstUse=!0,this.data=new Eo(this,lr())}nextDataId(){return r.nextDataId++}write(t,e,o){this.firstUse&&(this.firstUse=!1,F().get("IS_NODE")&&I.warn(`
============================
Hi, looks like you are running TensorFlow.js in Node.js. To speed things up dramatically, install our node backend, visit https://github.com/tensorflow/tfjs-node for more details. 
============================`));let n={id:this.nextDataId()};return this.data.set(n,{values:t,dtype:o,refCount:1}),n}makeTensorInfo(t,e,o){let n;if(e==="string"&&o!=null&&o.length>0&&y.isString(o[0])){let s=o.map(a=>y.encodeString(a));n=this.write(s,t,e)}else n=this.write(o,t,e);return{dataId:n,shape:t,dtype:e}}refCount(t){return this.data.has(t)?this.data.get(t).refCount:0}incRef(t){let e=this.data.get(t);e.refCount++}decRef(t){if(this.data.has(t)){let e=this.data.get(t);e.refCount--}}move(t,e,o,n,s){this.data.set(t,{values:e,dtype:n,refCount:s})}numDataIds(){return this.data.numDataIds()}async read(t){return this.readSync(t)}readSync(t){let{dtype:e,complexTensorInfos:o}=this.data.get(t);if(e==="complex64"){let n=this.readSync(o.real.dataId),s=this.readSync(o.imag.dataId);return I.mergeRealAndImagArrays(n,s)}return this.data.get(t).values}bufferSync(t){let e=this.readSync(t.dataId);if(t.dtype==="string")try{let o=e.map(n=>y.decodeString(n));return tt(t.shape,t.dtype,o)}catch{throw new Error("Failed to decode encoded string bytes into utf-8")}return tt(t.shape,t.dtype,e)}makeOutput(t,e,o){return lr().makeTensorFromTensorInfo(this.makeTensorInfo(e,o,t),this)}disposeData(t,e=!1){if(this.data.has(t)){if(this.data.get(t).refCount--,!e&&this.data.get(t).refCount>0)return!1;let{complexTensorInfos:o}=this.data.get(t);o!=null&&(this.disposeData(o.real.dataId,!0),this.disposeData(o.imag.dataId,!0)),this.data.delete(t)}return!0}disposeIntermediateTensorInfo(t){this.disposeData(t.dataId)}async time(t){let e=y.now();return t(),{kernelMs:y.now()-e}}memory(){return{unreliable:!0,reasons:["The reported memory is an upper bound. Due to automatic garbage collection, the true allocated memory may be less."]}}where(t){W([t],"where");let e=this.readSync(t.dataId);return A_(t.shape,e)}dispose(){}floatPrecision(){return 32}epsilon(){return super.epsilon()}};mc.nextDataId=0;var Ad={};At(Ad,{addImpl:()=>ad,bincountImpl:()=>li,bincountReduceImpl:()=>gl,castImpl:()=>sd,ceilImpl:()=>id,concatImpl:()=>xl,equalImpl:()=>cd,expImpl:()=>ld,expm1Impl:()=>md,floorImpl:()=>fd,gatherNdImpl:()=>yl,gatherV2Impl:()=>bl,greaterEqualImpl:()=>hd,greaterImpl:()=>dd,lessEqualImpl:()=>xd,lessImpl:()=>gd,linSpaceImpl:()=>Cl,logImpl:()=>yd,maxImpl:()=>Tl,maximumImpl:()=>bd,minimumImpl:()=>Cd,multiplyImpl:()=>fc,negImpl:()=>Td,notEqualImpl:()=>Sd,prodImpl:()=>wd,raggedGatherImpl:()=>Sl,raggedTensorToTensorImpl:()=>wl,rangeImpl:()=>Nl,rsqrtImpl:()=>Id,scatterImpl:()=>Ur,sigmoidImpl:()=>rC,simpleAbsImpl:()=>nd,sliceImpl:()=>kd,sparseFillEmptyRowsImpl:()=>Il,sparseReshapeImpl:()=>vl,sparseSegmentReductionImpl:()=>mi,sqrtImpl:()=>sC,squaredDifferenceImpl:()=>Ed,stridedSliceImpl:()=>kl,stringNGramsImpl:()=>El,stringSplitImpl:()=>$l,stringToHashBucketFastImpl:()=>Rl,subImpl:()=>Rd,tileImpl:()=>Al,topKImpl:()=>Fl,transposeImpl:()=>ui,uniqueImpl:()=>Dl});function nd(r){let t=new Float32Array(r.length);for(let e=0;e<r.length;++e)t[e]=Math.abs(r[e]);return t}var F_=r=>{let{x:t}=r.inputs,e=r.backend;W(t,"abs");let o=new Float32Array(y.sizeFromShape(t.shape)),n=e.data.get(t.dataId).values;return o=nd(n),e.makeOutput(o,t.shape,t.dtype)},$0={kernelName:"Abs",backendName:"cpu",kernelFunc:F_};function gt(r){return(t,e,o,n,s)=>{let a=I.assertAndGetBroadcastShape(t,e),i=a.length,c=y.computeStrides(a),p=y.sizeFromShape(a),l=y.getTypedArrayFromDType(s,p),u=t.length,m=e.length,f=y.computeStrides(t),d=y.computeStrides(e),h=I.getBroadcastDims(t,a),g=I.getBroadcastDims(e,a);if(h.length+g.length===0)for(let x=0;x<l.length;++x)l[x]=r(o[x%o.length],n[x%n.length]);else for(let x=0;x<l.length;++x){let b=y.indexToLoc(x,i,c),S=b.slice(-u);h.forEach(R=>S[R]=0);let N=y.locToIndex(S,u,f),k=b.slice(-m);g.forEach(R=>k[R]=0);let $=y.locToIndex(k,m,d);l[x]=r(o[N],n[$])}return[l,a]}}function ee(r){let{inputs:t,backend:e}=r,{real:o,imag:n}=t,s=e.data.get(o.dataId).values,a=e.data.get(n.dataId).values,i=e.makeTensorInfo(o.shape,"complex64"),c=e.data.get(i.dataId);return c.complexTensorInfos={real:e.makeTensorInfo(o.shape,"float32",s),imag:e.makeTensorInfo(n.shape,"float32",a)},i}var R0={kernelName:Ss,backendName:"cpu",kernelFunc:ee};function ci(r,t,e="float32"){if(e==="complex64"){let n=ci(r,t,"float32"),s=ci(r,t,"float32");return ee({inputs:{real:n,imag:s},backend:r})}let o=y.makeZerosTypedArray(y.sizeFromShape(t),e);return r.makeTensorInfo(t,e,o)}function le(r){let{inputs:t,backend:e}=r,{x:o}=t;return e.incRef(o.dataId),{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}var A0={kernelName:oo,backendName:"cpu",kernelFunc:le};function Qe(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.data.get(o.dataId).complexTensorInfos.real,s=e.data.get(n.dataId).values;return e.makeTensorInfo(n.shape,n.dtype,s)}var F0={kernelName:ha,backendName:"cpu",kernelFunc:Qe};function sd(r,t,e,o){if(o==="int32"){let n=Int32Array.from(r);return[t,"int32",n]}if(o==="bool"){let n=y.toTypedArray([0],e),[s,a]=gt((i,c)=>i!==c?1:0)(t,[],r,n,"bool");return[a,"bool",s]}throw new Error(`Error in Cast: failed to cast ${e} to ${o}`)}function Je(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dtype:s}=o;if(s==="complex64"){if(n.dtype==="complex64")return le({inputs:{x:n},backend:e});let l=ci(e,n.shape,n.dtype),u=Je({inputs:{x:n},backend:e,attrs:{dtype:"float32"}}),m=ee({inputs:{real:u,imag:l},backend:e});return e.disposeIntermediateTensorInfo(l),e.disposeIntermediateTensorInfo(u),m}if(n.dtype==="complex64"){let l=Qe({inputs:{input:n},backend:e}),u=Je({inputs:{x:l},backend:e,attrs:{dtype:s}});return e.disposeIntermediateTensorInfo(l),u}if(!y.hasEncodingLoss(n.dtype,s)){let l=le({inputs:{x:n},backend:e});return{dataId:l.dataId,shape:l.shape,dtype:s}}let a=e.data.get(n.dataId).values,[i,c,p]=sd(a,n.shape,n.dtype,s);return e.makeTensorInfo(i,c,p)}var D0={kernelName:ro,backendName:"cpu",kernelFunc:Je};function Ct(r,t,e,o){return e==null?({inputs:n,backend:s})=>{let{a,b:i}=n,c=s;W([a,i],r);let p=c.data.get(a.dataId).values,l=c.data.get(i.dataId).values,u=a.dtype==="string"?I.fromUint8ToStringArray(p):p,m=a.dtype==="string"?I.fromUint8ToStringArray(l):l,f=o||a.dtype,[d,h]=t(a.shape,i.shape,u,m,f);return c.makeTensorInfo(h,f,d)}:({inputs:n,backend:s})=>{let{a,b:i}=n,c=s;if(a.dtype==="complex64"||i.dtype==="complex64"){let p=Je({inputs:{x:a},backend:c,attrs:{dtype:"complex64"}}),l=c.data.get(p.dataId),u=l.complexTensorInfos.real,m=l.complexTensorInfos.imag,f=c.data.get(u.dataId).values,d=c.data.get(m.dataId).values,h=Je({inputs:{x:i},backend:c,attrs:{dtype:"complex64"}}),g=c.data.get(h.dataId),x=g.complexTensorInfos.real,b=g.complexTensorInfos.imag,S=c.data.get(x.dataId).values,N=c.data.get(b.dataId).values,[k,$,R]=e(a.shape,i.shape,f,d,S,N),A=c.makeTensorInfo(R,"float32",k),D=c.makeTensorInfo(R,"float32",$),_=ee({inputs:{real:A,imag:D},backend:c});return c.disposeIntermediateTensorInfo(p),c.disposeIntermediateTensorInfo(h),c.disposeIntermediateTensorInfo(A),c.disposeIntermediateTensorInfo(D),_}else{let p=c.data.get(a.dataId).values,l=c.data.get(i.dataId).values,u=o||a.dtype,[m,f]=t(a.shape,i.shape,p,l,u);return c.makeTensorInfo(f,u,m)}}}function pi(r){return(t,e,o,n,s,a)=>{let i=I.assertAndGetBroadcastShape(t,e),c=y.sizeFromShape(i),p=i.length,l=y.computeStrides(i),u=y.getTypedArrayFromDType("float32",c),m=y.getTypedArrayFromDType("float32",c),f=I.getBroadcastDims(t,i),d=I.getBroadcastDims(e,i),h=I.mergeRealAndImagArrays(o,n),g=I.mergeRealAndImagArrays(s,a),x=t.length,b=y.computeStrides(t),S=e.length,N=y.computeStrides(e);if(f.length+d.length===0)for(let k=0;k<u.length;k++){let $=k%h.length,R=k%g.length,A=r(h[$*2],h[$*2+1],g[R*2],g[R*2+1]);u[k]=A.real,m[k]=A.imag}else for(let k=0;k<u.length;k++){let $=y.indexToLoc(k,p,l),R=$.slice(-x);f.forEach(L=>R[L]=0);let A=y.locToIndex(R,x,b),D=$.slice(-S);d.forEach(L=>D[L]=0);let _=y.locToIndex(D,S,N),O=r(h[A*2],h[A*2+1],g[_*2],g[_*2+1]);u[k]=O.real,m[k]=O.imag}return[u,m,i]}}var ad=gt(((r,t)=>r+t)),D_=pi(((r,t,e,o)=>({real:r+e,imag:t+o}))),Er=Ct("Add",ad,D_),_0={kernelName:"Add",backendName:"cpu",kernelFunc:Er};function li(r,t,e,o,n){let s=y.sizeFromShape(o),a=y.makeZerosTypedArray(n,e);for(let i=0;i<r.length;i++){let c=r[i];if(c<0)throw new Error("Input x must be non-negative!");c>=n||(s>0?a[c]+=t[i]:a[c]+=1)}return a}function gl(r,t,e,o=!1){let n=r.shape[0],s=r.shape[1],a=tt([n,e],t.dtype);for(let i=0;i<n;i++)for(let c=0;c<s;c++){let p=r.get(i,c);if(p<0)throw new Error("Input x must be non-negative!");p>=e||(o?a.set(1,i,p):t.size>0?a.set(a.get(i,p)+t.get(i,c),i,p):a.set(a.get(i,p)+1,i,p))}return a}function Te(r){return(t,e,o)=>{let n=y.getTypedArrayFromDType(e,t.length);for(let s=0;s<t.length;++s)n[s]=r(t[s],o);return n}}function it(r,t,e){return({inputs:o,attrs:n,backend:s})=>{let{x:a}=o;if(W(a,r),a.dtype==="string"||e==="string")throw new Error("unaryKernelFunc does not support string input/output");let i=s,c=i.data.get(a.dataId).values,p=y.sizeFromShape(a.shape),l=e||a.dtype,u=y.getArrayFromDType(l,p);for(let m=0;m<p;++m)u[m]=t(c[m],n);return i.makeTensorInfo(a.shape,l,u)}}function tr(r,t,e){return({inputs:o,attrs:n,backend:s})=>{let{x:a}=o;if(W(a,r),a.dtype==="string"||e==="string")throw new Error("unaryKernelFunc does not support string input/output");let i=s,c=i.data.get(a.dataId).values,p=e||a.dtype,l=t(c,p,n);return i.makeTensorInfo(a.shape,p,l)}}var id=Te(r=>Math.ceil(r)),__=tr(Bo,id),O0={kernelName:Bo,backendName:"cpu",kernelFunc:__};function xl(r,t,e,o){let n=y.getArrayFromDType(e,y.sizeFromShape(t));if(o&&e!=="string"){let s=0;r.forEach(a=>{let i=y.sizeFromShape(a.shape);n.set(a.vals,s),s+=i})}else{let s=0;r.forEach(a=>{let i=e==="string"?I.fromUint8ToStringArray(a.vals):a.vals,c=0;for(let p=0;p<a.shape[0];++p){let l=p*t[1]+s;for(let u=0;u<a.shape[1];++u)n[l+u]=i[c++]}s+=a.shape[1]})}return n}var cd=gt((r,t)=>r===t?1:0),pd=Ct(Wo,cd,null,"bool"),P0={kernelName:Wo,backendName:"cpu",kernelFunc:pd};var ld=Te(r=>Math.exp(r)),ud=tr("Exp",ld,"float32"),L0={kernelName:"Exp",backendName:"cpu",kernelFunc:ud};var md=Te(r=>Math.expm1(r)),O_=tr(Go,md),B0={kernelName:Go,backendName:"cpu",kernelFunc:O_};var fd=Te(r=>Math.floor(r)),P_=tr(Uo,fd),V0={kernelName:Uo,backendName:"cpu",kernelFunc:P_};function yl(r,t,e,o,n,s,a,i,c){let p=tt([o,s],e);for(let l=0;l<o;l++){let u=[],m=0;for(let f=0;f<n;f++){let d=r[l*n+f];m+=d*a[f],u.push(d)}if(m<0||m>=c/s)throw new Error(`Invalid indices: ${u} does not index into ${i}`);for(let f=0;f<s;f++)p.values[l*s+f]=t.get(...t.indexToLoc(m*s+f))}return p}function bl(r,t,e){let o=tt(e,r.dtype);for(let n=0;n<o.size;++n){let a=o.indexToLoc(n).slice(),i=a[0],c=a[2],p=t.locToIndex([i,c]);a[2]=t.values[p];let l=r.locToIndex(a);0<=l&&l<r.values.length&&(o.values[n]=r.values[l])}return o}var dd=gt((r,t)=>r>t?1:0),L_=Ct(Ko,dd,null,"bool"),M0={kernelName:Ko,backendName:"cpu",kernelFunc:L_};var hd=gt((r,t)=>r>=t?1:0),B_=Ct(qo,hd,null,"bool"),z0={kernelName:qo,backendName:"cpu",kernelFunc:B_};var gd=gt((r,t)=>r<t?1:0),V_=Ct(Zo,gd,null,"bool"),W0={kernelName:Zo,backendName:"cpu",kernelFunc:V_};var xd=gt((r,t)=>r<=t?1:0),M_=Ct(Qo,xd,null,"bool"),G0={kernelName:Qo,backendName:"cpu",kernelFunc:M_};function Cl(r,t,e){let o=(t-r)/(e-1),n=y.makeZerosTypedArray(e,"float32");n[0]=r;for(let s=1;s<n.length;s++)n[s]=n[s-1]+o;return n}var yd=Te(r=>Math.log(r)),z_=tr("Log",yd),U0={kernelName:"Log",backendName:"cpu",kernelFunc:z_};function Tl(r,t,e,o){let n=y.getTypedArrayFromDType(o,y.sizeFromShape(e));for(let s=0;s<n.length;++s){let a=s*t,i=r[a];for(let c=0;c<t;++c){let p=r[a+c];(Number.isNaN(p)||p>i)&&(i=p)}n[s]=i}return n}var bd=gt(((r,t)=>Math.max(r,t))),W_=Ct(on,bd),H0={kernelName:on,backendName:"cpu",kernelFunc:W_};var Cd=gt(((r,t)=>Math.min(r,t))),G_=Ct(nn,Cd),K0={kernelName:nn,backendName:"cpu",kernelFunc:G_};var fc=gt(((r,t)=>r*t)),U_=pi(((r,t,e,o)=>({real:r*e-t*o,imag:r*o+t*e}))),Xn=Ct(sn,fc,U_),q0={kernelName:sn,backendName:"cpu",kernelFunc:Xn};function Td(r,t,e){let o=y.createScalarValue(-1,e);return fc([],t,o,r,e)}function H_(r){let{inputs:t,backend:e}=r,{x:o}=t;W(o,"neg");let n=e.data.get(o.dataId).values,[s,a]=Td(n,o.shape,o.dtype);return e.makeTensorInfo(a,o.dtype,s)}var X0={kernelName:"Neg",backendName:"cpu",kernelFunc:H_};var Sd=gt(((r,t)=>r!==t?1:0)),K_=Ct(an,Sd,null,"bool"),j0={kernelName:an,backendName:"cpu",kernelFunc:K_};function ui(r,t,e,o,n){let s=t.length,a=y.sizeFromShape(t),i=y.computeStrides(t),c=y.computeStrides(n),p=y.getTypedArrayFromDType(e,y.sizeFromShape(n));for(let l=0;l<a;++l){let u=y.indexToLoc(l,s,i),m=new Array(u.length);for(let d=0;d<m.length;d++)m[d]=u[o[d]];let f=y.locToIndex(m,s,c);p[f]=r[l]}return p}function Bt(r){let{inputs:t,attrs:e,backend:o}=r,{x:n}=t,{perm:s}=e;W(n,"transpose");let a=n.shape.length,i=new Array(a);for(let u=0;u<i.length;u++)i[u]=n.shape[s[u]];let c=o.data.get(n.dataId).values,p=ui(c,n.shape,n.dtype,s,i);return{dataId:o.write(p,i,n.dtype),shape:i,dtype:n.dtype}}var Y0={kernelName:so,backendName:"cpu",kernelFunc:Bt};function wd(r,t,e,o){let[n,s]=I.computeOutAndReduceShapes(r,o),a=Yt(t,"int32"),i=y.makeZerosTypedArray(y.sizeFromShape(n),a),c=y.sizeFromShape(s);for(let p=0;p<i.length;++p){let l=p*c,u=1;for(let m=0;m<c;++m)u*=e[l+m];i[p]=u}return{outVals:i,outShape:n,outDtype:a}}function q_(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;W(n,"prod");let i=n.shape.length,c=y.parseAxisParam(s,n.shape),p=I.getAxesPermutation(c,i),l=c,u=n,m=[];p!=null&&(u=Bt({inputs:{x:n},backend:e,attrs:{perm:p}}),m.push(u),l=I.getInnerMostAxes(l.length,i));let f=e.data.get(u.dataId).values,{outVals:d,outShape:h,outDtype:g}=wd(u.shape,u.dtype,f,l),x=h;return a&&(x=I.expandShapeToKeepDim(h,c)),m.forEach(b=>e.disposeIntermediateTensorInfo(b)),e.makeTensorInfo(x,g,d)}var Z0={kernelName:ua,backendName:"cpu",kernelFunc:q_};function X_(r,t,e){r.forEach((o,n)=>{if(o<0||o>=e){let s=y.indexToLoc(n,t.length,y.computeStrides(t)).join(",");throw new Error(`indices[${s}] = ${o} is not in [0, ${e})`)}})}function j_(r,t){for(let e=0;e<r.length;++e){let o=r[e],n=e===r.length-1?t:r[e+1].length;if(o.length===0)throw new Error("Ragged splits may not be empty");if(o[0]<0)throw new Error("Ragged splits must be non-negative");if(o[o.length-1]>n)throw new Error("Ragged splits must not point past values");for(let s=1;s<o.length;++s)if(o[s-1]>o[s])throw new Error("Ragged splits must be sorted in ascending order")}}function Y_(r,t,e,o){let n=[],s=0,a=t.length-1+e.length,i=new Array(a).fill(null).map(()=>[0]);j_(e,o);let c=1;for(let p=0;p<t.length-1;++p){c*=t[p];let l=t[p+1];for(let u=1;u<c+1;++u)i[p].push(u*l)}for(let p=0;p<r.length;++p){let l=r[p],u=r[p]+1;for(let m=0;m<e.length;++m){let f=e[m],d=m+t.length-1;if(d>=0){let h=i[d],g=h[h.length-1]-f[l];for(let x=l;x<u;++x)i[d].push(f[x+1]+g)}l=f[l],u=f[u]}u!==l&&(n.push([l,u]),s+=u-l)}return{outSplits:i,valueSlices:n,numValues:s}}function Z_(r){let t=[];for(let e=0;e<r.length;++e){let o=r[e].length,n=y.getArrayFromDType("int32",o);t.push(n),r[e].forEach((s,a)=>n[a]=s)}return t}function Q0(r,t){let e=r.slice(0,t);for(;e.length<t;)e.push(1);for(let o=t;o<r.length;o++)e[t-1]*=r[o];return e}function Q_(r,t,e,o,n,s){let a=Q0(t,2)[1],i=Q0(s,2)[1],c=0;for(let p of e)for(let l=p[0];l<p[1];++l){for(let u=0;u<o;++u)n[c*i+u]=r[l*a+u];++c}}function J_(r,t,e,o,n){let s=t.slice();s[0]=n;let a=y.getArrayFromDType(e,y.sizeFromShape(s)),i=r.length,c=i===0?0:i/t[0];return Q_(r,t,o,c,a,s),[a,s]}function Sl(r,t,e,o,n,s,a,i){if(r.length===0)throw new Error("paramsNestedSplits must be non empty");if(t[0].length===0)throw new Error("Split tensors must not be scalars");let c=t[0][0]-1;if(X_(s,a,c),o.length===0)throw new Error("params.rank must be nonzero");let p=o[0],{outSplits:l,valueSlices:u,numValues:m}=Y_(s,a,r,p),f=Z_(l),d=J_(e,o,n,u,m);return[f,d[0],d[1]]}var er=I.RowPartitionType,Nd=class r{constructor(t,e,o,n,s,a,i,c,p,l){this.shape=t,this.shapeShape=e,this.values=o,this.valuesShape=n,this.valuesDType=s,this.defaultValue=a,this.defaultValueShape=i,this.rowPartitionValues=c,this.rowPartitionValuesShapes=p,this.rowPartitionTypes=I.getRowPartitionTypesHelper(l),this.raggedRank=I.getRaggedRank(this.rowPartitionTypes)}getRowPartitionTypeByDimension(t){return this.rowPartitionTypes[0]===er.FIRST_DIM_SIZE?this.rowPartitionTypes[t+1]:this.rowPartitionTypes[t]}getRowPartitionTensor(t){return this.rowPartitionTypes[0]===er.FIRST_DIM_SIZE?this.rowPartitionValues[t+1]:this.rowPartitionValues[t]}getMaxWidth(t){let e=this.getRowPartitionTensor(t-1);switch(this.getRowPartitionTypeByDimension(t-1)){case er.VALUE_ROWIDS:return r.getMaxWidthValueRowID(e);case er.ROW_SPLITS:return r.getMaxWidthRowSplit(e);default:throw new Error(`Cannot handle partition type ${er[this.getRowPartitionTypeByDimension(t-1)]}`)}}static getMaxWidthRowSplit(t){let e=t.length;if(e===0||e===1)return 0;let o=0;for(let n=0;n<e-1;++n){let s=t[n+1]-t[n];s>o&&(o=s)}return o}static getMaxWidthValueRowID(t){let e=t.length;if(e===0)return 0;let o=0,n=t[0],s=0;for(let a=1;a<e;++a){let i=t[a];i!==n&&(n=i,s=Math.max(a-o,s),o=a)}return Math.max(e-o,s)}tensorShapeFromTensor(t,e,o=!0){if(e.length===0){if(t[0]===-1)return[];throw new Error("The only valid scalar shape tensor is the fully unknown shape specified as -1.")}return tC(t,o)}calculateOutputSize(t){let e=this.valuesShape,o=this.defaultValueShape;I.validateDefaultValueShape(o,e);let n=this.tensorShapeFromTensor(this.shape,this.shapeShape),a=I.combineRaggedTensorToTensorShapes(this.raggedRank,n,e);a[0]<0&&(a[0]=t);for(let i=1;i<=this.raggedRank;++i)a[i]<0&&(a[i]=this.getMaxWidth(i));return a}calculateFirstParentOutputIndex(t,e,o){let n=Math.min(t,o),s=[],a=0;for(let i=0;i<n;++i,a+=e)s.push(a);for(let i=n;i<t;++i)s.push(-1);return y.assert(s.length===t,()=>"Final length of result must be equal to firstDimension."),s}calculateOutputIndexRowSplit(t,e,o,n){let s=t.length,a=[];for(let i=0;i<s-1;++i){let c=t[i+1]-t[i],p=Math.min(n,c),l=e[i];l===-1&&(p=0);for(let u=0;u<p;++u)a.push(l),l+=o;for(let u=0;u<c-p;++u)a.push(-1)}if(s>0&&a.length!==t[s-1])throw new Error("Invalid row split size.");return a}calculateOutputIndexValueRowID(t,e,o,n){let s=t.length,a=[];if(s===0)return[];let i=0,c=t[0];if(c>=e.length)throw new Error(`Got currentValueRowId=${c}, which is not less than ${e.length}`);let p=e[c];a.push(p);for(let l=1;l<s;++l){let u=t[l];if(u===c)p>=0&&(++i,i<n?p+=o:p=-1);else{if(i=0,c=u,u>=e.length)throw new Error(`Got nextValueRowId=${u} which is not less than ${e.length}`);p=e[u]}a.push(p)}if(a.length!==t.length)throw new Error("Invalid row ids.");return a}calculateOutputIndex(t,e,o,n){let s=this.getRowPartitionTensor(t),a=this.getRowPartitionTypeByDimension(t);switch(a){case er.VALUE_ROWIDS:return this.calculateOutputIndexValueRowID(s,e,o,n);case er.ROW_SPLITS:if(s.length-1>e.length)throw new Error(`Row partition size is greater than output size: ${s.length-1} > ${e.length}`);return this.calculateOutputIndexRowSplit(s,e,o,n);default:throw new Error(`Unsupported partition type: ${er[a]}`)}}getFirstDimensionSize(){let t=this.rowPartitionValues[0];if(this.rowPartitionTypes.length===0)throw new Error("No row_partition_types given.");let e=this.rowPartitionTypes[0];switch(e){case er.FIRST_DIM_SIZE:return t[0];case er.VALUE_ROWIDS:throw new Error("Cannot handle VALUE_ROWIDS in first dimension.");case er.ROW_SPLITS:return this.rowPartitionValuesShapes[0][0]-1;default:throw new Error(`Cannot handle type ${er[e]}`)}}compute(){if(this.rowPartitionValues[0].length<=0)throw new Error("Invalid first partition input. Tensor requires at least one element.");let e=this.getFirstDimensionSize(),o=this.calculateOutputSize(e),n=new Array(this.raggedRank+1);n[n.length-1]=1;for(let c=n.length-2;c>=0;--c)n[c]=n[c+1]*o[c+1];let s=tC(o,!1),a=y.getArrayFromDType(this.valuesDType,y.sizeFromShape(s));if(n[0]*o[0]>0){let c=this.calculateFirstParentOutputIndex(e,n[0],o[0]);for(let p=1;p<=this.raggedRank;++p)c=this.calculateOutputIndex(p-1,c,n[p],o[p]);this.setOutput(this.raggedRank,c,a,s)}return[s,a]}setOutput(t,e,o,n){if(o.length===0)return;let s=this.values,a=o,i=n.slice();i=i.slice(t+1);let c=y.sizeFromShape(i),p=e.length,l=this.defaultValue;if(l.length!==c&&l.length!==1){let d=this.defaultValueShape;Jt(()=>{let h=P(l,d);l=mo(h,i).dataSync()})}let u=0,m=0,f=0;for(let d=0;d<=p;++d){let h=d<p?e[d]:-1;if(h===f){++f;continue}if(m<f){let g=s.subarray(u*c),x=a.subarray(m*c),b=(f-m)*c;J0(x,g,b)}if(d>=p){let g=o.length;h=Math.floor(g/c)}if(h>f)if(this.defaultValue.length===1)a.subarray(f*c,h*c).fill(this.defaultValue[0]),f=h;else for(;h>f;){let g=a.slice(f*c);J0(g,l,c),++f}h<0?(u=d+1,m=f):(u=d,m=f,f=m+1)}}};function J0(r,t,e){for(let o=0;o<e;o++)r[o]=t[o]}function tC(r,t){let e=[];for(let o of r){if(o<0){if(!t)throw new Error(`Dimension ${o} must be >= 0`);if(o<-1)throw new Error(`Dimension ${o} must be >= -1`);o=-1}e.push(o)}return e}function wl(r,t,e,o,n,s,a,i,c,p){return new Nd(r,t,e,o,n,s,a,i,c,p).compute()}function Nl(r,t,e,o){let n=r===t,s=r<t&&e<0,a=t<r&&e>1;if(n||s||a)return y.makeZerosTypedArray(0,o);let i=Math.abs(Math.ceil((t-r)/e)),c=y.makeZerosTypedArray(i,o);t<r&&e===1&&(e=-1),c[0]=r;for(let p=1;p<c.length;p++)c[p]=c[p-1]+e;return c}var Id=Te(r=>1/Math.sqrt(r)),tO=tr(mn,Id),eC={kernelName:mn,backendName:"cpu",kernelFunc:tO};function Ur(r,t,e,o,n,s,a,i,c,p){let l=[o/n,n],u=r.values,m=t.values;if(o===0)return tt(e,t.dtype);let f=tt(l,t.dtype);typeof c=="string"||typeof c=="number"?f.values.fill(c):typeof c=="boolean"&&f.values.fill(+c);for(let d=0;d<s;d++){let h=[],g=0;for(let x=0;x<a;x++){let b=u[d*a+x];h.push(b),g+=b*i[x]}if(g<0||g>=o/n)throw new Error(`Invalid indices: ${h} does not index into ${e}`);for(let x=0;x<n;x++)p?f.values[g*n+x]+=m[d*n+x]:f.values[g*n+x]=t.rank===0?m[0]:m[d*n+x]}return f}var rC=Te(r=>1/(1+Math.exp(-r))),vd=it(gn,r=>1/(1+Math.exp(-r))),oC={kernelName:gn,backendName:"cpu",kernelFunc:vd};function kd(r,t,e,o,n){let s=ne.isSliceContinous(o,t,e),a=y.sizeFromShape(e),i=y.computeStrides(o);if(s){let u=ne.computeFlatOffset(t,i);return n==="string"?r.slice(u,u+a):r.subarray(u,u+a)}let c=n==="string"?I.fromUint8ToStringArray(r):r,p=tt(o,n,c),l=tt(e,n);for(let u=0;u<l.size;++u){let m=l.indexToLoc(u),f=m.map((d,h)=>d+t[h]);l.set(p.get(...f),...m)}return n==="string"?I.fromStringArrayToUint8(l.values):l.values}function rr(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,size:a}=o;W(n,"slice");let[i,c]=ne.parseSliceParams(n,s,a);ne.assertParamsValid(n,i,c);let p=e.data.get(n.dataId).values,l=kd(p,i,c,n.shape,n.dtype);return e.makeTensorInfo(c,n.dtype,l)}var nC={kernelName:wa,backendName:"cpu",kernelFunc:rr};function Il(r,t,e,o,n,s,a){let i=t[0],c=s[0],p=new Array(c),l=new Array(i),u=t[1];if(c===0){if(i!==0)throw new Error(I.getSparseFillEmptyRowsIndicesDenseShapeMismatch(i));let g=y.getArrayFromDType(e,0),x=y.getArrayFromDType(n,0);return[g,[0,u],x,p,l]}let m=!0,f=0,d=new Array(c).fill(0);for(let g=0;g<i;++g){let x=r[g*u];if(x<0)throw new Error(I.getSparseFillEmptyRowsNegativeIndexErrorMessage(g,x));if(x>=c)throw new Error(I.getSparseFillEmptyRowsOutOfRangeIndexErrorMessage(g,x,c));++d[x],m=m&&x>=f,f=x}let h=!0;for(let g=0;g<c;++g){let x=d[g]===0;p[g]=x,h=h&&!x,d[g]=Math.max(d[g],1),g>0&&(d[g]+=d[g-1])}if(h&&m){let g=r,x=o;for(let b=0;b<i;++b)l[b]=b;return[g,[i,u],x,p,l]}else{let g=d[c-1],x=y.getArrayFromDType(e,g*u),b=y.getArrayFromDType(n,g),S=new Array(c).fill(0);for(let N=0;N<i;++N){let k=r[N*u],$=S[k],R=(k===0?0:d[k-1])+$;S[k]++;for(let A=0;A<u;++A)x[R*u+A]=r[N*u+A];b[R]=o[N],l[N]=R}for(let N=0;N<c;++N)if(S[N]===0){let $=N===0?0:d[N-1];x[$*u+0]=N;for(let R=1;R<u;++R)x[$*u+R]=0;b[$]=a}return[x,[g,u],b,p,l]}}function vl(r,t,e,o,n){let s=y.sizeFromShape(o),a=t[0],i=n.length,c=[],p=1,l=-1;for(let g=0;g<i;++g){let x=n[g];if(x===-1){if(l!==-1)throw new Error(I.getSparseReshapeMultipleNegativeOneOutputDimErrorMessage(l,g));l=g,c.push(1)}else{if(x<0)throw new Error(I.getSparseReshapeNegativeOutputDimErrorMessage(g,x));p*=x,c.push(x)}}if(l!==-1){if(p<=0)throw new Error(I.getSparseReshapeEmptyTensorZeroOutputDimErrorMessage());let g=Math.trunc(s/p);if(p*g!==s)throw new Error(I.getSparseReshapeInputOutputMultipleErrorMessage(o,c));c[l]=g}if(y.sizeFromShape(c)!==s)throw new Error(I.getSparseReshapeInputOutputMismatchErrorMessage(o,c));let m=o.length,f=[];if(m>0){f[m-1]=1;for(let g=m-2;g>=0;--g)f[g]=f[g+1]*o[g+1]}let d=[];if(i>0){d[i-1]=1;for(let g=i-2;g>=0;--g)d[g]=d[g+1]*c[g+1]}let h=y.getArrayFromDType(e,a*i);for(let g=0;g<a;++g){let x=0;for(let b=0;b<m;++b)x+=r[g*m+b]*f[b];for(let b=0;b<i;++b)h[g*i+b]=Math.trunc(x/d[b]),x%=d[b]}return[h,[a,i],c]}function mi(r,t,e,o,n,s=!1,a=0){let i=o.length,c=[t[0],r.length/t[0]],p=c[1],u=i>0?n[i-1]+1:0;if(u<0)throw new Error(I.getSparseSegmentReductionNegativeSegmentIdsErrorMessage());let m=t.slice();m[0]=u;let f=m.reduce((S,N)=>S*N,1),d=y.getArrayFromDType(e,f);if(i===0)return u>0&&d.fill(a),[d,m];if(u<=0)throw new Error(I.getSparseSegmentReductionNegativeSegmentIdsErrorMessage());let h=0,g=1,x=0,b=n[h];for(;;){let S=0;if(g<i){if(S=n[g],b===S){++g;continue}if(b>=S)throw new Error(I.getSparseSegmentReductionNonIncreasingSegmentIdsErrorMessage())}if(b<0||b>=u)throw new Error(I.getSparseSegmentReductionSegmentIdOutOfRangeErrorMessage(b,u));b>x&&d.fill(a,x*p,b*p);for(let N=h;N<g;++N){let k=o[N];if(k<0||k>=c[0])throw new Error(I.getSparseSegmentReductionIndicesOutOfRangeErrorMessage(N,o[N],c[0]));for(let $=0;$<p;$++)d[b*p+$]+=r[k*p+$]}if(s)for(let N=0;N<p;N++)d[b*p+N]/=g-h;if(h=g,++g,x=b+1,b=S,g>i)break}return x<u&&d.fill(a,x*p,u*p),[d,m]}var sC=Te(r=>Math.sqrt(r)),eO=it(yn,r=>Math.sqrt(r)),aC={kernelName:yn,backendName:"cpu",kernelFunc:eO};var Ed=gt(((r,t)=>{let e=r-t;return e*e})),rO=Ct(bn,Ed),iC={kernelName:bn,backendName:"cpu",kernelFunc:rO};function kl(r,t,e,o){let n=tt(r,t.dtype);for(let s=0;s<n.size;s++){let a=n.indexToLoc(s),i=new Array(a.length);for(let c=0;c<i.length;c++)i[c]=a[c]*e[c]+o[c];n.set(t.get(...i),...a)}return n}var $d=class{constructor(t,e,o,n,s,a){this.separator=y.encodeString(t),this.nGramWidths=e,this.leftPad=y.encodeString(o),this.rightPad=y.encodeString(n),this.padWidth=s,this.preserveShort=a}getPadWidth(t){return Math.min(this.padWidth<0?t-1:this.padWidth,t-1)}getNumNGrams(t,e){let o=this.getPadWidth(e);return Math.max(0,t+2*o-e+1)}createNGrams(t,e,o,n,s,a){for(let i=0;i<s;++i){let c=this.getPadWidth(a),p=Math.max(0,c-i),l=Math.max(0,c-(s-(i+1))),u=a-(p+l),m=e+(p>0?0:i-c),f=0;f+=p*this.leftPad.length;for(let b=0;b<u;++b)f+=t[m+b].length;f+=l*this.rightPad.length;let d=p+l+u-1;f+=d*this.separator.length,o[n+i]=new Uint8Array(f);let h=o[n+i],g=0,x=b=>b.forEach(S=>h[g++]=S);for(let b=0;b<p;++b)x(this.leftPad),x(this.separator);for(let b=0;b<u-1;++b)x(t[m+b]),x(this.separator);if(u>0){x(t[m+u-1]);for(let b=0;b<l;++b)x(this.separator),x(this.rightPad)}else{for(let b=0;b<l-1;++b)x(this.rightPad),x(this.separator);x(this.rightPad)}}}compute(t,e){let o=t.length,n=e.length;if(n>0){let c=e[0];if(c!==0)throw new Error(`First split value must be 0, got ${c}`);for(let p=1;p<n;++p){let l=e[p]>=c;if(l=l&&e[p]<=o,!l)throw new Error(`Invalid split value ${e[p]}, must be in [${c}, ${o}]`);c=e[p]}if(c!==o)throw new Error(`Last split value must be data size. Expected ${o}, got ${c}`)}let s=n-1,a=y.getArrayFromDType("int32",n);if(o===0||n===0){let c=new Array(o);for(let p=0;p<=s;++p)a[p]=0;return[c,a]}a[0]=0;for(let c=1;c<=s;++c){let p=e[c]-e[c-1],l=0;this.nGramWidths.forEach(u=>{l+=this.getNumNGrams(p,u)}),this.preserveShort&&p>0&&l===0&&(l=1),a[c]=a[c-1]+l}let i=new Array(a[s]);for(let c=0;c<s;++c){let p=e[c],l=a[c];if(this.nGramWidths.forEach(u=>{let m=e[c+1]-e[c],f=this.getNumNGrams(m,u);this.createNGrams(t,p,i,l,f,u),l+=f}),this.preserveShort&&l===a[c]){let u=e[c+1]-e[c];if(u===0)continue;let m=u+2*this.padWidth;this.createNGrams(t,p,i,l,1,m)}}return[i,a]}};function El(r,t,e,o,n,s,a,i){return new $d(e,o,n,s,a,i).compute(r,t)}function oO(r,t,e,o){if(!r.length)return;if(t.length===0){for(let s=0;s<r.length;++s)o.push(r.subarray(s,s+1));return}if(t.length===1){let s=t[0],a=r.indexOf(s);for(;a!==-1;){let i=r.subarray(0,a);(!e||i.length!==0)&&o.push(i),r=r.subarray(a+1),a=r.indexOf(s)}(!e||r.length!==0)&&o.push(r);return}let n=0;for(let s=0;s<r.length+1;s++)if(s===r.length||t.indexOf(r[s])!==-1){let a=r.subarray(n,s);(!e||a.length!==0)&&o.push(a),n=s+1}}function $l(r,t,e){let o=r.length,n=[],s=0,a=0,i=new Array(o);for(let m=0;m<o;++m){let f=n.length;oO(r[m],t,e,n);let d=n.length-f;i[m]=d,s+=d,a=Math.max(a,d)}let c=y.getArrayFromDType("int32",s*2),p=new Array(s),l=[o,a],u=0;for(let m=0;m<o;++m)for(let f=0;f<i[m];++f)c[u*2]=m,c[u*2+1]=f,p[u]=n[u],++u;return[c,p,l]}function Rl(r,t){let e=y.getArrayFromDType("int32",r.length);for(let o=0;o<r.length;++o)e[o]=y.fingerPrint64(r[o]).modulo(t).getLowBitsUnsigned();return e}var Rd=gt(((r,t)=>r-t)),nO=pi(((r,t,e,o)=>({real:r-e,imag:t-o}))),dc=Ct("Sub",Rd,nO),cC={kernelName:"Sub",backendName:"cpu",kernelFunc:dc};function Al(r,t){let e=new Array(r.rank);for(let n=0;n<e.length;n++)e[n]=r.shape[n]*t[n];let o=tt(e,r.dtype);for(let n=0;n<o.values.length;++n){let s=o.indexToLoc(n),a=new Array(r.rank);for(let c=0;c<a.length;c++)a[c]=s[c]%r.shape[c];let i=r.locToIndex(a);o.values[n]=r.values[i]}return o}var hc=(r,t)=>{let e=t.value-r.value;return e===0?r.index-t.index:e};function pC(r,t,e=0,o=r.length-1){for(;o>e;){if(o-e>600){let i=o-e+1,c=t-e+1,p=Math.log(i),l=.5*Math.exp(2*p/3),u=.5*Math.sqrt(p*l*(i-l)/i)*Math.sign(c-i/2),m=Math.max(e,Math.floor(t-c*l/i+u)),f=Math.min(o,Math.floor(t+(i-c)*l/i+u));pC(r,t,m,f)}let n=r[t],s=e,a=o;for(y.swap(r,e,t),hc(r[o],n)>0&&y.swap(r,e,o);s<a;){for(y.swap(r,s,a),s++,a--;hc(r[s],n)<0;)s=s+1;for(;hc(r[a],n)>0;)a=a-1}hc(r[e],n)===0?y.swap(r,e,a):(a=a+1,y.swap(r,a,o)),a<=t&&(e=a+1),t<=a&&(o=a-1)}}function Fl(r,t,e,o,n){let s=t[t.length-1],[a,i]=[r.length/s,s],c=y.getTypedArrayFromDType(e,a*o),p=y.getTypedArrayFromDType("int32",a*o);for(let u=0;u<a;u++){let m=u*i,f=r.subarray(m,m+i),d=new Array(f.length);f.forEach((b,S)=>d[S]={value:b,index:S}),o<d.length&&(pC(d,o),d=d.slice(0,o)),n&&d.sort(hc);let h=u*o,g=c.subarray(h,h+o),x=p.subarray(h,h+o);for(let b=0;b<o;b++)g[b]=d[b].value,x[b]=d[b].index}let l=t.slice();return l[l.length-1]=o,[tt(l,e,c),tt(l,"int32",p)]}function Dl(r,t,e,o){let n=y.parseAxisParam(t,e)[0],s=[1,e[0],1];for(let d=0;d<n;d++)s[0]*=e[d];s[1]=e[n];for(let d=n+1;d<e.length;d++)s[2]*=e[d];let a={},i=new Int32Array(e[n]),c=new vt(s,o,r),p=[],l=s[0]===1&&s[2]===1;for(let d=0;d<e[n];d++){let h;if(l)h=r[d].toString();else{let g=[];for(let x=0;x<s[0];x++)for(let b=0;b<s[2];b++)g.push(c.get(x,d,b));h=g.join(",")}if(a[h]!==void 0)i[d]=a[h];else{let g=Object.keys(a).length;a[h]=g,i[d]=g,p.push(d)}}let u=s.slice();u[1]=Object.keys(a).length;let m=new vt(u,o);p.forEach((d,h)=>{for(let g=0;g<s[0];g++)for(let x=0;x<s[2];x++)m.set(c.get(g,d,x),g,h,x)});let f=e.slice();return f[n]=u[1],{outputValues:m.values,outputShape:f,indices:i}}gp("cpu",()=>new mc,1);var Fd=it("Elu",r=>r>=0?r:Math.exp(r)-1),lC={kernelName:"Elu",backendName:"cpu",kernelFunc:Fd};function Dd(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{alpha:s}=o;W([n],"leakyRelu");let a=y.sizeFromShape(n.shape),i=e.data.get(n.dataId).values,c=y.getTypedArrayFromDType("float32",a);for(let p=0;p<i.length;p++)c[p]=i[p]<0?s*i[p]:i[p];return e.makeTensorInfo(n.shape,"float32",c)}var uC={kernelName:js,backendName:"cpu",kernelFunc:Dd};var sO=gt((r,t)=>r<0?t*r:r);function _d(r){let{inputs:t,backend:e}=r,{x:o,alpha:n}=t;W([o,n],"prelu");let s=e.data.get(o.dataId).values,a=e.data.get(n.dataId).values,[i,c]=sO(o.shape,n.shape,s,a,"float32");return e.makeTensorInfo(c,"float32",i)}var mC={kernelName:la,backendName:"cpu",kernelFunc:_d};var Od=it(pn,r=>Math.max(0,r)),fC={kernelName:pn,backendName:"cpu",kernelFunc:Od};var Pd=it(ln,r=>Math.min(Math.max(0,r),6)),dC={kernelName:ln,backendName:"cpu",kernelFunc:Pd};function jn(r,t,e,o,n){if(e==="linear")return le({inputs:{x:t},backend:r});if(e==="relu")return Od({inputs:{x:t},backend:r});if(e==="elu")return Fd({inputs:{x:t},backend:r});if(e==="relu6")return Pd({inputs:{x:t},backend:r});if(e==="prelu")return _d({inputs:{x:t,alpha:o},backend:r});if(e==="leakyrelu")return Dd({inputs:{x:t},backend:r,attrs:{alpha:n}});if(e==="sigmoid")return vd({inputs:{x:t},backend:r});throw new Error(`Activation ${e} has not been implemented for the CPU backend.`)}function dt(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{shape:s}=o,a=y.sizeFromShape(n.shape),i=y.inferFromImplicitShape(s,a),c=y.sizeFromShape(i);y.assert(a===c,()=>`The new shape (${i}) has ${c} elements and the old shape (${n.shape}) has ${a} elements. The new shape and old shape must have the same number of elements.`),e.incRef(n.dataId);let p=e.data.get(n.dataId);if(p.complexTensorInfos!=null){let l=p.complexTensorInfos.real,u=p.complexTensorInfos.imag;l.shape=i,u.shape=i}return{dataId:n.dataId,shape:i,dtype:n.dtype}}var hC={kernelName:ga,backendName:"cpu",kernelFunc:dt};function Ld(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s}=t,{transposeA:a,transposeB:i}=o;W([n,s],"matMul");let c=n.shape.length,p=s.shape.length,l=a?n.shape[c-2]:n.shape[c-1],u=i?s.shape[p-1]:s.shape[p-2],m=a?n.shape[c-1]:n.shape[c-2],f=i?s.shape[p-2]:s.shape[p-1],d=n.shape.slice(0,-2),h=s.shape.slice(0,-2),g=y.sizeFromShape(d),x=y.sizeFromShape(h),S=Tr.assertAndGetBroadcastShape(n.shape.slice(0,-2),s.shape.slice(0,-2)).concat([m,f]);y.assert(l===u,()=>`Error in matMul: inner shapes (${l}) and (${u}) of Tensors with shapes ${n.shape} and ${s.shape} and transposeA=${a} and transposeB=${i} must match.`);let N=a?[g,l,m]:[g,m,l],k=i?[x,f,u]:[x,u,f],$=dt({inputs:{x:n},backend:e,attrs:{shape:N}}),R=dt({inputs:{x:s},backend:e,attrs:{shape:k}}),A=a?$.shape[1]:$.shape[2],D=a?$.shape[2]:$.shape[1],_=i?R.shape[1]:R.shape[2],O=Math.max(g,x),L=e.data.get($.dataId).values,B=e.data.get(R.dataId).values,M=y.computeStrides($.shape),V=y.computeStrides(R.shape),[G,U,z]=a?[M[0],1,M[1]]:[M[0],M[1],1],[H,q,X]=i?[1,V[1],V[0]]:[V[1],1,V[0]],Z=D*_,j=tt([O,D,_],$.dtype),J=j.values,Y=e.blockSize;for(let et=0;et<O;et++)for(let nt=0;nt<D;nt+=Y)for(let ct=0;ct<_;ct+=Y)for(let pt=0;pt<A;pt+=Y){let ht=Math.min(nt+Y,D),bt=Math.min(ct+Y,_),Rt=Math.min(pt+Y,A);for(let Ot=nt;Ot<ht;Ot++)for(let Mt=ct;Mt<bt;Mt++){let Gt=0;for(let Ft=pt;Ft<Rt;Ft++){let jt=Math.min(et,g-1)*G,Qt=Math.min(et,x-1)*X,Dr=L[jt+Ot*U+Ft*z],ie=B[Ft*H+Mt*q+Qt];Gt+=Dr*ie}J[et*Z+(Ot*_+Mt)]+=Gt}}return e.disposeIntermediateTensorInfo($),e.disposeIntermediateTensorInfo(R),e.makeTensorInfo(S,j.dtype,j.values)}var gC={kernelName:ys,backendName:"cpu",kernelFunc:Ld};function aO(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s,bias:a,preluActivationWeights:i}=t,{transposeA:c,transposeB:p,activation:l,leakyreluAlpha:u}=o,m,f,d,h=[];m=Ld({inputs:{a:n,b:s},attrs:{transposeA:c,transposeB:p},backend:e}),a&&(f=Er({inputs:{a:m,b:a},backend:e}),h.push(m),m=f),l&&(d=jn(e,m,l,i,u),h.push(m),m=d);for(let x of h)e.disposeIntermediateTensorInfo(x);return m}var xC={kernelName:Sn,backendName:"cpu",kernelFunc:aO};var iO=it(Ao,r=>Math.acos(r)),yC={kernelName:Ao,backendName:"cpu",kernelFunc:iO};var cO=it(Fo,r=>Math.acosh(r)),bC={kernelName:Fo,backendName:"cpu",kernelFunc:cO};function pO(r){let{inputs:t,backend:e}=r,o=t;W(t,"addN");let n=o.map(i=>e.data.get(i.dataId).values),s=tt(o[0].shape,o[0].dtype),a=s.values;for(let i=0;i<o.length;i++){let c=n[i];for(let p=0;p<a.length;p++)a[p]+=c[p]}return e.makeTensorInfo(s.shape,s.dtype,s.values)}var CC={kernelName:fs,backendName:"cpu",kernelFunc:pO};function lO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;W(n,"all");let i=y.parseAxisParam(s,n.shape),c=i,p=I.getAxesPermutation(c,n.shape.length),l=n;p!=null&&(l=Bt({inputs:{x:n},backend:e,attrs:{perm:p}}),c=I.getInnerMostAxes(c.length,n.shape.length)),I.assertAxesAreInnerMostDims("all",c,l.shape.length);let[u,m]=I.computeOutAndReduceShapes(l.shape,c),f=y.sizeFromShape(m),d=y.makeZerosTypedArray(y.sizeFromShape(u),l.dtype),h=e.data.get(l.dataId).values;for(let x=0;x<d.length;++x){let b=x*f,S=h[b];for(let N=0;N<f;++N){let k=h[b+N];S=S&&k}d[x]=S}p!=null&&e.disposeIntermediateTensorInfo(l);let g=e.makeTensorInfo(u,l.dtype,d);if(a){let x=I.expandShapeToKeepDim(u,i),b=dt({inputs:{x:g},backend:e,attrs:{shape:x}});return e.disposeIntermediateTensorInfo(g),b}return g}var TC={kernelName:"All",backendName:"cpu",kernelFunc:lO};function uO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;W(n,"any");let i=y.parseAxisParam(s,n.shape),c=i,p=I.getAxesPermutation(c,n.shape.length),l=n;p!=null&&(l=Bt({inputs:{x:n},backend:e,attrs:{perm:p}}),c=I.getInnerMostAxes(c.length,n.shape.length)),I.assertAxesAreInnerMostDims("any",c,l.shape.length);let[u,m]=I.computeOutAndReduceShapes(l.shape,c),f=y.sizeFromShape(m),d=y.makeZerosTypedArray(y.sizeFromShape(u),l.dtype),h=e.data.get(l.dataId).values;for(let x=0;x<d.length;++x){let b=x*f,S=h[b];for(let N=0;N<f;++N){let k=h[b+N];S=S||k}d[x]=S}p!=null&&e.disposeIntermediateTensorInfo(l);let g=e.makeTensorInfo(u,l.dtype,d);if(a){let x=I.expandShapeToKeepDim(u,i),b=dt({inputs:{x:g},backend:e,attrs:{shape:x}});return e.disposeIntermediateTensorInfo(g),b}return g}var SC={kernelName:"Any",backendName:"cpu",kernelFunc:uO};function mO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o;W(n,"argMax");let a=y.parseAxisParam(s,n.shape),i=I.getAxesPermutation(a,n.shape.length),c=n,p=[];i!=null&&(c=Bt({inputs:{x:n},backend:e,attrs:{perm:i}}),p.push(c),a=I.getInnerMostAxes(a.length,c.shape.length)),a=[a[0]],I.assertAxesAreInnerMostDims("argMax",a,c.shape.length);let[l,u]=I.computeOutAndReduceShapes(c.shape,a),m=y.sizeFromShape(l),f=y.makeZerosTypedArray(m,"int32"),d=y.sizeFromShape(u),h=e.data.get(c.dataId).values;for(let g=0;g<f.length;++g){let x=g*d,b=h[x],S=0;for(let N=0;N<d;++N){let k=h[x+N];k>b&&(b=k,S=N)}f[g]=S}return p.forEach(g=>e.disposeIntermediateTensorInfo(g)),e.makeTensorInfo(l,"int32",f)}var wC={kernelName:ds,backendName:"cpu",kernelFunc:mO};function fO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o;W(n,"argMin");let a=y.parseAxisParam(s,n.shape),i=I.getAxesPermutation(a,n.shape.length),c=n,p=[];i!=null&&(c=Bt({inputs:{x:n},backend:e,attrs:{perm:i}}),p.push(c),a=I.getInnerMostAxes(a.length,c.shape.length)),a=[a[0]],I.assertAxesAreInnerMostDims("argMin",a,c.shape.length);let[l,u]=I.computeOutAndReduceShapes(c.shape,a),m=y.sizeFromShape(l),f=y.makeZerosTypedArray(m,"int32"),d=y.sizeFromShape(u),h=e.data.get(c.dataId).values;for(let g=0;g<f.length;++g){let x=g*d,b=h[x],S=0;for(let N=0;N<d;++N){let k=h[x+N];k<b&&(b=k,S=N)}f[g]=S}return p.forEach(g=>e.disposeIntermediateTensorInfo(g)),e.makeTensorInfo(l,"int32",f)}var NC={kernelName:hs,backendName:"cpu",kernelFunc:fO};var dO=it(Do,r=>Math.asin(r)),IC={kernelName:Do,backendName:"cpu",kernelFunc:dO};var hO=it(_o,r=>Math.asinh(r)),vC={kernelName:_o,backendName:"cpu",kernelFunc:hO};var gO=it(Oo,r=>Math.atan(r)),kC={kernelName:Oo,backendName:"cpu",kernelFunc:gO};var xO=gt((r,t)=>Math.atan2(r,t)),yO=Ct(Lo,xO),EC={kernelName:Lo,backendName:"cpu",kernelFunc:yO};var bO=it(Po,r=>Math.atanh(r)),$C={kernelName:Po,backendName:"cpu",kernelFunc:bO};function fi(r,t,e,o,n,s){let a=n.strideHeight,i=n.strideWidth,c=n.dilationHeight,p=n.dilationWidth,l=n.effectiveFilterHeight,u=n.effectiveFilterWidth,m=n.padInfo.top,f=n.padInfo.left,d=s==="max"?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY,h=tt(n.outShape,e),g=h.values,x=n.outShape[1]*n.outShape[2]*n.outShape[3],b=n.outShape[2]*n.outShape[3],S=n.outShape[3];for(let N=0;N<n.batchSize;++N){let k=N*x,$=N*o[0];for(let R=0;R<n.inChannels;++R)for(let A=0;A<n.outHeight;++A){let D=A*a-m,_=Math.max(0,D),O=Math.min(n.inHeight,l+D),L=k+A*b;for(let B=0;B<n.outWidth;++B){let M=B*i-f,V=Math.max(0,M),G=Math.min(n.inWidth,u+M),U=d,z=0,H=0;for(let X=_;X<O;X+=c){let Z=$+X*o[1];for(let j=V;j<G;j+=p){let J=Z+j*o[2],Y=r[J+R];s==="max"&&Y>U?U=Y:s==="avg"&&(z+=Y,H++)}if(isNaN(U))break}let q=L+B*S+R;g[q]=s==="avg"?z/H:U}}}return h}function _l(r,t,e,o,n=!1,s=!1){let a=tt(o.outShape,"int32"),i=o.strideHeight,c=o.strideWidth,p=o.dilationHeight,l=o.dilationWidth,u=o.effectiveFilterHeight,m=o.effectiveFilterWidth,f=o.padInfo.top,d=o.padInfo.left,h=tt(t,e,r);for(let g=0;g<o.batchSize;++g)for(let x=0;x<o.inChannels;++x)for(let b=0;b<o.outHeight;++b){let S=b*i-f,N=S;for(;N<0;)N+=p;let k=Math.min(o.inHeight,u+S);for(let $=0;$<o.outWidth;++$){let R=$*c-d,A=R;for(;A<0;)A+=l;let D=Math.min(o.inWidth,m+R),_=Number.NEGATIVE_INFINITY,O=-1;for(let L=N;L<k;L+=p){let B=L-S;for(let M=A;M<D;M+=l){let V=M-R,G=h.get(g,L,M,x);G>_&&(_=G,n?O=s?((g*o.inHeight+L)*o.inWidth+M)*o.inChannels+x:(L*o.inWidth+M)*o.inChannels+x:O=B*m+V)}}a.set(O,g,b,$,x)}}return a}function Ol(r,t,e,o,n,s){let a=n.strideDepth,i=n.strideHeight,c=n.strideWidth,p=n.dilationDepth,l=n.dilationHeight,u=n.dilationWidth,m=n.effectiveFilterDepth,f=n.effectiveFilterHeight,d=n.effectiveFilterWidth,h=n.padInfo.front,g=n.padInfo.top,x=n.padInfo.left,b=s==="max"?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY,S=tt(n.outShape,e),N=S.values,k=n.outShape[1]*n.outShape[2]*n.outShape[3]*n.outShape[4],$=n.outShape[2]*n.outShape[3]*n.outShape[4],R=n.outShape[3]*n.outShape[4],A=n.outShape[4];for(let D=0;D<n.batchSize;++D){let _=D*k,O=D*o[0];for(let L=0;L<n.inChannels;++L)for(let B=0;B<n.outDepth;++B){let M=B*a-h,V=M;for(;V<0;)V+=p;let G=Math.min(n.inDepth,m+M),U=_+B*$;for(let z=0;z<n.outHeight;++z){let H=z*i-g,q=H;for(;q<0;)q+=l;let X=Math.min(n.inHeight,f+H),Z=U+z*R;for(let j=0;j<n.outWidth;++j){let J=j*c-x,Y=J;for(;Y<0;)Y+=u;let et=Math.min(n.inWidth,d+J),nt=Z+j*A,ct=b,pt=0,ht=0;for(let Rt=V;Rt<G;Rt+=p){let Ot=O+Rt*o[1];for(let Mt=q;Mt<X;Mt+=l){let Gt=Ot+Mt*o[2];for(let Ft=Y;Ft<et;Ft+=u){let jt=Gt+Ft*o[3],Qt=r[jt+L];if(s==="max"&&Qt>ct?ct=Qt:s==="avg"&&(pt+=Qt,ht++),isNaN(ct))break}if(isNaN(ct))break}if(isNaN(ct))break}let bt=nt+L;N[bt]=s==="avg"?pt/ht:ct}}}}return S}function RC(r,t){let e=tt(t.outShape,"int32"),o=t.strideDepth,n=t.strideHeight,s=t.strideWidth,a=t.dilationDepth,i=t.dilationHeight,c=t.dilationWidth,p=t.effectiveFilterDepth,l=t.effectiveFilterHeight,u=t.effectiveFilterWidth,m=t.padInfo.front,f=t.padInfo.top,d=t.padInfo.left;for(let h=0;h<t.batchSize;++h)for(let g=0;g<t.inChannels;++g)for(let x=0;x<t.outDepth;++x){let b=x*o-m,S=b;for(;S<0;)S+=a;let N=Math.min(t.inDepth,p+b);for(let k=0;k<t.outHeight;++k){let $=k*n-f,R=$;for(;R<0;)R+=i;let A=Math.min(t.inHeight,l+$);for(let D=0;D<t.outWidth;++D){let _=D*s-d,O=_;for(;O<0;)O+=c;let L=Math.min(t.inWidth,u+_),B=Number.NEGATIVE_INFINITY,M=-1;for(let V=S;V<N;V+=a){let G=V-b;for(let U=R;U<A;U+=i){let z=U-$;for(let H=O;H<L;H+=c){let q=H-_,X=r.get(h,V,U,H,g);X>=B&&(B=X,M=G*l*u+z*l+q)}}}e.set(M,h,x,k,D,g)}}}return e}function CO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;W(n,"avgPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:c}=o,p=1;y.assert(I.eitherStridesOrDilationsAreOne(a,p),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${p}'`);let l=I.computePool2DInfo(n.shape,s,a,p,i,c),u;if(l.filterWidth===1&&l.filterHeight===1&&y.arraysEqual(l.inShape,l.outShape))u=le({inputs:{x:n},backend:e});else{let m=e.data.get(n.dataId).values,f=y.computeStrides(n.shape),d=fi(m,n.shape,n.dtype,f,l,"avg");u=e.makeTensorInfo(l.outShape,n.dtype,d.values)}return u}var AC={kernelName:gs,backendName:"cpu",kernelFunc:CO};function TO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dimRoundingMode:c,dataFormat:p}=o;W(n,"avgPool3d");let l=I.computePool3DInfo(n.shape,s,a,1,i,c,p),u=e.data.get(n.dataId).values,m=Ol(u,n.shape,n.dtype,y.computeStrides(n.shape),l,"avg");return e.makeTensorInfo(m.shape,"float32",m.values)}var FC={kernelName:xs,backendName:"cpu",kernelFunc:TO};function SO(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,{filterSize:a,strides:i,pad:c,dimRoundingMode:p}=o;W([n,s],"avgPool3DGrad");let l=I.computePool3DInfo(s.shape,a,i,1,c,p),u=l.strideDepth,m=l.strideHeight,f=l.strideWidth,d=l.filterDepth,h=l.filterHeight,g=l.filterWidth,x=l.dilationDepth,b=l.dilationHeight,S=l.dilationWidth,N=l.effectiveFilterDepth,k=l.effectiveFilterHeight,$=l.effectiveFilterWidth,R=N-1-l.padInfo.front,A=$-1-l.padInfo.left,D=k-1-l.padInfo.top,_=tt(s.shape,"float32"),O=1/(d*h*g),L=e.bufferSync(n);for(let B=0;B<l.batchSize;++B)for(let M=0;M<l.inChannels;++M)for(let V=0;V<l.inDepth;++V)for(let G=0;G<l.inHeight;++G)for(let U=0;U<l.inWidth;++U){let z=V-R,H=G-D,q=U-A,X=0;for(let Z=0;Z<N;Z+=x){let j=(z+Z)/u;if(!(j<0||j>=l.outDepth||Math.floor(j)!==j))for(let J=0;J<k;J+=b){let Y=(H+J)/m;if(!(Y<0||Y>=l.outHeight||Math.floor(Y)!==Y))for(let et=0;et<$;et+=S){let nt=(q+et)/f;if(nt<0||nt>=l.outWidth||Math.floor(nt)!==nt)continue;let ct=L.get(B,j,Y,nt,M);X+=ct}}}_.set(X*O,B,V,G,U,M)}return e.makeTensorInfo(_.shape,_.dtype,_.values)}var DC={kernelName:Wc,backendName:"cpu",kernelFunc:SO};function wO(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s;W([n,s],"avgPoolGrad");let{filterSize:i,strides:c,pad:p}=o,l=I.computePool2DInfo(a.shape,i,c,1,p),u=l.strideHeight,m=l.strideWidth,f=l.filterHeight,d=l.filterWidth,h=l.dilationHeight,g=l.dilationWidth,x=l.effectiveFilterHeight,b=l.effectiveFilterWidth,S=b-1-l.padInfo.left,N=x-1-l.padInfo.top,k=tt(a.shape,"float32"),$=1/(f*d),R=e.data.get(n.dataId).values,A=tt(n.shape,"float32",R);for(let D=0;D<l.batchSize;++D)for(let _=0;_<l.inChannels;++_)for(let O=0;O<l.inHeight;++O)for(let L=0;L<l.inWidth;++L){let B=O-N,M=L-S,V=0;for(let G=0;G<x;G+=h){let U=(B+G)/u;if(!(U<0||U>=l.outHeight||Math.floor(U)!==U))for(let z=0;z<b;z+=g){let H=(M+z)/m;if(H<0||H>=l.outWidth||Math.floor(H)!==H)continue;let q=A.get(D,U,H,_);V+=q}}k.set(V*$,D,O,L,_)}return e.makeTensorInfo(k.shape,k.dtype,k.values)}var _C={kernelName:zc,backendName:"cpu",kernelFunc:wO};function NO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,scale:s,offset:a,mean:i,variance:c}=t;y.assert(i.shape.length===c.shape.length,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),y.assert(a==null||i.shape.length===a.shape.length,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),y.assert(s==null||i.shape.length===s.shape.length,()=>"Batch normalization gradient requires mean and scale to have equal ranks."),W([n,i,c,s,a],"batchNorm");let{varianceEpsilon:p}=o;p==null&&(p=.001);let l=e.data.get(n.dataId).values,u=e.data.get(i.dataId).values,m=e.data.get(c.dataId).values,f=s?e.data.get(s.dataId).values:new Float32Array([1]),d=a?e.data.get(a.dataId).values:new Float32Array([0]),h=new Float32Array(l.length),g=d.length,x=f.length,b=m.length,S=u.length,N=0,k=0,$=0,R=0;for(let A=0;A<l.length;++A)h[A]=d[N++]+(l[A]-u[k++])*f[$++]/Math.sqrt(m[R++]+p),N>=g&&(N=0),k>=S&&(k=0),$>=x&&($=0),R>=b&&(R=0);return e.makeTensorInfo(n.shape,n.dtype,h)}var OC={kernelName:Us,backendName:"cpu",kernelFunc:NO};function IO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,crops:a}=o;W([n],"batchToSpaceND");let i=s.reduce((x,b)=>x*b),c=I.getReshaped(n.shape,s,i),p=I.getPermuted(c.length,s.length),l=I.getReshapedPermuted(n.shape,s,i),u=I.getSliceBeginCoords(a,s.length),m=I.getSliceSize(l,a,s.length),f=dt({inputs:{x:n},backend:e,attrs:{shape:c}}),d=Bt({inputs:{x:f},backend:e,attrs:{perm:p}}),h=dt({inputs:{x:d},backend:e,attrs:{shape:l}}),g=rr({inputs:{x:h},backend:e,attrs:{begin:u,size:m}});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(h),g}var PC={kernelName:bs,backendName:"cpu",kernelFunc:IO};function vO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a}=o,i=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,p=li(i,c,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,p)}var LC={kernelName:Cs,backendName:"cpu",kernelFunc:vO};function kO(r){let{inputs:t,backend:e}=r,{s0:o,s1:n}=t,s=e.data.get(o.dataId).values,a=e.data.get(n.dataId).values,i=I.assertAndGetBroadcastShape(Array.from(s),Array.from(a));return e.makeTensorInfo([i.length],"int32",Int32Array.from(i))}var BC={kernelName:Ts,backendName:"cpu",kernelFunc:kO};var EO=it(Vo,(r,t)=>{let e=t;return r>e.clipValueMax?e.clipValueMax:r<e.clipValueMin?e.clipValueMin:r}),VC={kernelName:Vo,backendName:"cpu",kernelFunc:EO};var $O=r=>{let{x:t}=r.inputs,e=r.backend,o=new Float32Array(y.sizeFromShape(t.shape)),n=e.data.get(t.dataId),s=n.complexTensorInfos.real,a=n.complexTensorInfos.imag,i=e.data.get(s.dataId).values,c=e.data.get(a.dataId).values;for(let p=0;p<i.length;p++){let l=i[p],u=c[p];o[p]=Math.hypot(l,u)}return e.makeOutput(o,t.shape,"float32")},MC={kernelName:ws,backendName:"cpu",kernelFunc:$O};function $r(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.data.get(o.dataId).complexTensorInfos.imag,s=e.data.get(n.dataId).values;return e.makeTensorInfo(n.shape,n.dtype,s)}var zC={kernelName:Xs,backendName:"cpu",kernelFunc:$r};function To(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o,s=y.parseAxisParam(n,t[0].shape)[0],a=t.map(h=>h.shape);I.assertParamsConsistent(a,s);let i=I.computeOutShape(t.map(h=>h.shape),s);if(y.sizeFromShape(i)===0)return e.makeTensorInfo(i,t[0].dtype,[]);let c=t.filter(h=>y.sizeFromShape(h.shape)>0);if(c.length===1)return le({inputs:{x:c[0]},backend:e});if(c[0].dtype==="complex64"){let h=c.map(N=>Qe({inputs:{input:N},backend:e})),g=c.map(N=>$r({inputs:{input:N},backend:e})),x=To({inputs:h,backend:e,attrs:{axis:s}}),b=To({inputs:g,backend:e,attrs:{axis:s}}),S=ee({inputs:{real:x,imag:b},backend:e});return h.forEach(N=>e.disposeIntermediateTensorInfo(N)),g.forEach(N=>e.disposeIntermediateTensorInfo(N)),e.disposeIntermediateTensorInfo(x),e.disposeIntermediateTensorInfo(b),S}let p=c.map(h=>{let x=[-1,y.sizeFromShape(h.shape.slice(s))];return dt({inputs:{x:h},backend:e,attrs:{shape:x}})}),l=p.map(h=>({vals:e.data.get(h.dataId).values,shape:h.shape}));i=I.computeOutShape(p.map(h=>h.shape),1);let u=p[0].shape[0]===1,m=xl(l,i,t[0].dtype,u),f=I.computeOutShape(c.map(h=>h.shape),s),d=e.makeTensorInfo(f,t[0].dtype,m);return p.forEach(h=>e.disposeIntermediateTensorInfo(h)),d}var WC={kernelName:Ns,backendName:"cpu",kernelFunc:To};function Bd(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dataFormat:c,dilations:p,dimRoundingMode:l}=o;W([n,s],"conv2d");let u=I.convertConv2DDataFormat(c),m=I.computeConv2DInfo(n.shape,s.shape,a,p,i,l,!1,u),f=m.filterHeight,d=m.filterWidth,h=m.dilationHeight,g=m.dilationWidth,x=m.padInfo.left,b=m.padInfo.top,S=m.dataFormat==="channelsLast",N=new vt(m.outShape,n.dtype),k=y.computeStrides(n.shape),$=y.computeStrides(s.shape),R=k[0],A=S?k[1]:k[2],D=S?k[2]:1,_=S?1:k[1],O=N.strides[0],L=S?N.strides[1]:N.strides[2],B=S?N.strides[2]:1,M=S?1:N.strides[1],V=e.data.get(n.dataId).values,G=e.data.get(s.dataId).values,U=N.values;for(let z=0;z<m.batchSize;++z){let H=z*R,q=z*O;for(let X=0;X<m.outHeight;++X){let Z=q+X*L,j=X*m.strideHeight-b;for(let J=0;J<f;++J){let Y=j+J*h;if(Y<0||Y>=m.inHeight)continue;let et=J*$[0],nt=H+Y*A;for(let ct=0;ct<m.outWidth;++ct){let pt=Z+ct*B,ht=ct*m.strideWidth-x;for(let bt=0;bt<d;++bt){let Rt=ht+bt*g;if(Rt<0||Rt>=m.inWidth)continue;let Ot=et+bt*$[1],Mt=nt+Rt*D,Gt=Ot;for(let Ft=0;Ft<m.inChannels;++Ft){let jt=V[Mt+Ft*_];for(let Qt=0;Qt<m.outChannels;++Qt)U[pt+Qt*M]+=jt*G[Gt+Qt];Gt+=m.outChannels}}}}}}return e.makeTensorInfo(N.shape,N.dtype,U)}var GC={kernelName:Is,backendName:"cpu",kernelFunc:Bd};function RO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,dataFormat:c,dimRoundingMode:p,filterShape:l}=o;W([n,s],"conv2dBackpropFilter");let u=I.convertConv2DDataFormat(c),m=I.computeConv2DInfo(n.shape,l,a,1,i,p,!1,u),{strideHeight:f,strideWidth:d,filterHeight:h,filterWidth:g}=m,x=m.dataFormat==="channelsLast",b=new vt(m.filterShape,"float32"),S=m.padInfo.left,N=m.padInfo.top,k=e.data.get(n.dataId).values,$=e.data.get(s.dataId).values,R=new vt(n.shape,n.dtype,k),A=new vt(s.shape,s.dtype,$);for(let D=0;D<h;++D){let _=Math.max(0,Math.ceil((N-D)/f)),O=Math.min(m.outHeight,(m.inHeight+N-D)/f);for(let L=0;L<g;++L){let B=Math.max(0,Math.ceil((S-L)/d)),M=Math.min(m.outWidth,(m.inWidth+S-L)/d);for(let V=0;V<m.inChannels;++V)for(let G=0;G<m.outChannels;++G){let U=0;for(let z=0;z<m.batchSize;++z)for(let H=_;H<O;++H){let q=D+H*f-N;for(let X=B;X<M;++X){let Z=L+X*d-S;x?U+=R.get(z,q,Z,V)*A.get(z,H,X,G):U+=R.get(z,V,q,Z)*A.get(z,G,H,X)}}b.set(U,D,L,V,G)}}}return e.makeTensorInfo(b.shape,b.dtype,b.values)}var UC={kernelName:vs,backendName:"cpu",kernelFunc:RO};function AO(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{inputShape:a,strides:i,pad:c,dataFormat:p,dimRoundingMode:l}=o;W([n,s],"conv2dBackpropInput");let u=y.computeStrides(s.shape),m=y.computeStrides(n.shape),f=I.convertConv2DDataFormat(p),d=I.computeConv2DInfo(a,s.shape,i,1,c,l,!1,f),h=new vt(d.inShape,"float32"),g=h.values,x=e.data.get(n.dataId).values,b=e.data.get(s.dataId).values,[S,N,k]=u,{batchSize:$,filterHeight:R,filterWidth:A,inChannels:D,inHeight:_,inWidth:O,outChannels:L,outHeight:B,outWidth:M,strideHeight:V,strideWidth:G}=d;f=d.dataFormat;let U=R-1-d.padInfo.top,z=A-1-d.padInfo.left,H=f==="channelsLast",q=h.strides[0],X=H?h.strides[1]:h.strides[2],Z=H?h.strides[2]:1,j=H?1:h.strides[1],J=m[0],Y=H?m[1]:m[2],et=H?m[2]:1,nt=H?1:m[1];for(let ct=0;ct<$;++ct)for(let pt=0;pt<D;++pt)for(let ht=0;ht<_;++ht){let bt=ht-U,Rt=Math.max(0,Math.ceil(bt/V)),Ot=Math.min(B,(R+bt)/V);for(let Mt=0;Mt<O;++Mt){let Gt=Mt-z,Ft=Math.max(0,Math.ceil(Gt/G)),jt=Math.min(M,(A+Gt)/G),Qt=0;for(let ie=Rt;ie<Ot;++ie){let Yr=ie*V-bt;for(let Oe=Ft;Oe<jt;++Oe){let ko=Oe*G-Gt,ar=J*ct+Y*ie+et*Oe,_r=S*(R-1-Yr)+N*(A-1-ko)+k*pt;for(let Zr=0;Zr<L;++Zr){let Qr=x[ar+nt*Zr],Jr=b[_r+Zr];Qt+=Qr*Jr}}}let Dr=q*ct+X*ht+Z*Mt+j*pt;g[Dr]=Qt}}return e.makeTensorInfo(h.shape,h.dtype,h.values)}var HC={kernelName:ks,backendName:"cpu",kernelFunc:AO};function FO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:c}=o;W([n,s],"conv3d");let p=I.computeConv3DInfo(n.shape,s.shape,a,c,i),{filterDepth:l,filterHeight:u,filterWidth:m,dilationDepth:f,dilationHeight:d,dilationWidth:h,padInfo:g}=p,x=g.front,b=g.left,S=g.top,N=new vt(p.outShape,n.dtype),k=e.data.get(n.dataId).values,$=e.data.get(s.dataId).values,R=N.values,A=y.computeStrides(n.shape),D=y.computeStrides(s.shape);for(let _=0;_<p.batchSize;++_){let O=_*A[0],L=_*N.strides[0];for(let B=0;B<p.outDepth;++B){let M=L+B*N.strides[1],V=B*p.strideDepth-x;for(let G=0;G<l;++G){let U=V+G*f;if(U<0||U>=p.inDepth)continue;let z=G*D[0],H=O+U*A[1];for(let q=0;q<p.outHeight;++q){let X=M+q*N.strides[2],Z=q*p.strideHeight-S;for(let j=0;j<u;++j){let J=Z+j*d;if(J<0||J>=p.inHeight)continue;let Y=z+j*D[1],et=H+J*A[2];for(let nt=0;nt<p.outWidth;++nt){let ct=X+nt*p.outChannels,pt=nt*p.strideWidth-b;for(let ht=0;ht<m;++ht){let bt=pt+ht*h;if(bt<0||bt>=p.inWidth)continue;let Rt=Y+ht*D[2],Ot=et+bt*p.inChannels,Mt=Rt;for(let Gt=0;Gt<p.inChannels;++Gt){let Ft=k[Ot+Gt];for(let jt=0;jt<p.outChannels;++jt)R[ct+jt]+=Ft*$[Mt+jt];Mt+=p.outChannels}}}}}}}}return e.makeTensorInfo(N.shape,N.dtype,N.values)}var KC={kernelName:Es,backendName:"cpu",kernelFunc:FO};function DO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,filterShape:c}=o;W([n,s],"conv3dBackpropFilterV2");let p=y.computeStrides(n.shape),l=y.computeStrides(s.shape),u=I.computeConv3DInfo(n.shape,c,a,1,i),m=u.strideDepth,f=u.strideHeight,d=u.strideWidth,h=u.filterDepth,g=u.filterHeight,x=u.filterWidth,b=new vt(u.filterShape,"float32"),S=b.values,[N,k,$,R]=b.strides,A=e.data.get(s.dataId).values,[D,_,O,L]=l,B=e.data.get(n.dataId).values,[M,V,G,U]=p,z=u.padInfo.front,H=u.padInfo.left,q=u.padInfo.top;for(let X=0;X<h;++X){let Z=Math.max(0,Math.ceil((z-X)/m)),j=Math.min(u.outDepth,(u.inDepth+z-X)/m),J=X*N;for(let Y=0;Y<g;++Y){let et=Math.max(0,Math.ceil((q-Y)/f)),nt=Math.min(u.outHeight,(u.inHeight+q-Y)/f),ct=Y*k+J;for(let pt=0;pt<x;++pt){let ht=Math.max(0,Math.ceil((H-pt)/d)),bt=Math.min(u.outWidth,(u.inWidth+H-pt)/d),Rt=pt*$+ct;for(let Ot=0;Ot<u.inChannels;++Ot){let Mt=Ot*R+Rt;for(let Gt=0;Gt<u.outChannels;++Gt){let Ft=0;for(let jt=0;jt<u.batchSize;++jt){let Qt=jt*M,Dr=jt*D;for(let ie=Z;ie<j;++ie){let Oe=(X+ie*m-z)*V+Qt,ko=ie*_+Dr;for(let ar=et;ar<nt;++ar){let Zr=(Y+ar*f-q)*G+Oe,Qr=ar*O+ko;for(let Jr=ht;Jr<bt;++Jr){let Wm=(pt+Jr*d-H)*U+Zr,Gm=Jr*L+Qr;Ft+=B[Wm+Ot]*A[Gm+Gt]}}}}S[Mt+Gt]=Ft}}}}}return e.makeTensorInfo(b.shape,b.dtype,b.values)}var qC={kernelName:Gc,backendName:"cpu",kernelFunc:DO};function _O(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{pad:a,strides:i,inputShape:c}=o;W([n],"conv3dBackpropInputV2");let p=y.computeStrides(n.shape),l=y.computeStrides(s.shape),u=I.computeConv3DInfo(c,s.shape,i,1,a),m=new vt(u.inShape,"float32"),f=m.values,[d,h,g,x]=m.strides,b=e.data.get(n.dataId).values,[S,N,k,$]=p,R=e.data.get(s.dataId).values,[A,D,_,O]=l,{batchSize:L,filterDepth:B,filterHeight:M,filterWidth:V,inChannels:G,inDepth:U,inHeight:z,inWidth:H,outChannels:q,outDepth:X,outHeight:Z,outWidth:j,strideDepth:J,strideHeight:Y,strideWidth:et}=u,nt=B-1-u.padInfo.front,ct=M-1-u.padInfo.top,pt=V-1-u.padInfo.left;for(let ht=0;ht<L;++ht)for(let bt=0;bt<G;++bt)for(let Rt=0;Rt<U;++Rt){let Ot=Rt-nt,Mt=Math.max(0,Math.ceil(Ot/J)),Gt=Math.min(X,(B+Ot)/J);for(let Ft=0;Ft<z;++Ft){let jt=Ft-ct,Qt=Math.max(0,Math.ceil(jt/Y)),Dr=Math.min(Z,(M+jt)/Y);for(let ie=0;ie<H;++ie){let Yr=ie-pt,Oe=Math.max(0,Math.ceil(Yr/et)),ko=Math.min(j,(V+Yr)/et),ar=0;for(let _r=Mt;_r<Gt;++_r){let Zr=_r*J-Ot;for(let Qr=Qt;Qr<Dr;++Qr){let Jr=Qr*Y-jt;for(let Oi=Oe;Oi<ko;++Oi){let Wm=Oi*et-Yr,Gm=S*ht+N*_r+k*Qr+$*Oi,Kk=A*(B-1-Zr)+D*(M-1-Jr)+_*(V-1-Wm)+O*bt;for(let Lc=0;Lc<q;++Lc){let qk=b[Gm+Lc],Xk=R[Kk+Lc];ar+=qk*Xk}}}}f[d*ht+h*Rt+g*Ft+x*ie+bt]=ar}}}return e.makeTensorInfo(m.shape,m.dtype,m.values)}var XC={kernelName:$s,backendName:"cpu",kernelFunc:_O};var OO=it("Cos",r=>Math.cos(r)),jC={kernelName:"Cos",backendName:"cpu",kernelFunc:OO};var PO=it(Mo,r=>Math.cosh(r)),YC={kernelName:Mo,backendName:"cpu",kernelFunc:PO};function LO(r){let{inputs:t,backend:e,attrs:o}=r,{image:n,boxes:s,boxInd:a}=t,{cropSize:i,method:c,extrapolationValue:p}=o,[l,u,m,f]=n.shape,d=s.shape[0],[h,g]=i,x=tt([d,h,g,f],"float32"),b=e.data.get(s.dataId).values,S=e.data.get(a.dataId).values,N=e.data.get(n.dataId).values,k=y.computeStrides(n.shape),$=y.computeStrides(x.shape);for(let R=0;R<d;R++){let A=R*4,D=b[A],_=b[A+1],O=b[A+2],L=b[A+3],B=S[R];if(B>=l)continue;let M=h>1?(O-D)*(u-1)/(h-1):0,V=g>1?(L-_)*(m-1)/(g-1):0;for(let G=0;G<h;G++){let U=h>1?D*(u-1)+G*M:.5*(D+O)*(u-1);if(U<0||U>u-1){for(let z=0;z<g;z++)for(let H=0;H<f;H++){let q=H+z*$[2]+G*$[1]+R*$[0];x.values[q]=p}continue}if(c==="bilinear"){let z=Math.floor(U),H=Math.ceil(U),q=U-z;for(let X=0;X<g;X++){let Z=g>1?_*(m-1)+X*V:.5*(_+L)*(m-1);if(Z<0||Z>m-1){for(let et=0;et<f;et++){let nt=et+X*$[2]+G*$[1]+R*$[0];x.values[nt]=p}continue}let j=Math.floor(Z),J=Math.ceil(Z),Y=Z-j;for(let et=0;et<f;et++){let nt=et+j*k[2]+z*k[1]+B*k[0],ct=N[nt];nt=et+J*k[2]+z*k[1]+B*k[0];let pt=N[nt];nt=et+j*k[2]+H*k[1]+B*k[0];let ht=N[nt];nt=et+J*k[2]+H*k[1]+B*k[0];let bt=N[nt],Rt=ct+(pt-ct)*Y,Ot=ht+(bt-ht)*Y;nt=et+X*$[2]+G*$[1]+R*$[0],x.values[nt]=Rt+(Ot-Rt)*q}}}else for(let z=0;z<g;++z){let H=g>1?_*(m-1)+z*V:.5*(_+L)*(m-1);if(H<0||H>m-1){for(let Z=0;Z<f;Z++){let j=Z+z*$[2]+G*$[1]+R*$[0];x.values[j]=p}continue}let q=Math.round(H),X=Math.round(U);for(let Z=0;Z<f;Z++){let j=Z+q*k[2]+X*k[1]+B*k[0],J=Z+z*$[2]+G*$[1]+R*$[0];x.values[J]=N[j]}}}}return e.makeTensorInfo(x.shape,x.dtype,x.values)}var ZC={kernelName:Fs,backendName:"cpu",kernelFunc:LO};function BO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;W(n,"cumprod");let c=I.getAxesPermutation([s],n.shape.length),p=n;c!=null&&(p=Bt({inputs:{x:n},backend:e,attrs:{perm:c}}));let l=I.getInnerMostAxes(1,n.shape.length)[0];if(l!==p.shape.length-1)throw new Error(`backend.cumprod in CPU expects an inner-most axis=${p.shape.length-1} but got axis=${l}`);let u=Yt(p.dtype,"int32"),m=y.makeOnesTypedArray(y.sizeFromShape(p.shape),u),f=e.data.get(p.dataId).values,d=p.shape[p.shape.length-1],h=i?(x,b)=>x+d-b-1:(x,b)=>x+b;for(let x=0;x<f.length;x+=d)for(let b=0;b<d;b++){let S=h(x,b);if(b===0)m[S]=a?1:f[S];else{let N=h(x,b-1);m[S]=a?f[N]*m[N]:f[S]*m[N]}}let g=e.makeTensorInfo(p.shape,u,m);if(c!=null){let x=I.getUndoAxesPermutation(c),b=Bt({inputs:{x:g},backend:e,attrs:{perm:x}});return e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(p),b}return g}var QC={kernelName:Rs,backendName:"cpu",kernelFunc:BO};function VO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;W(n,"cumsum");let c=I.getAxesPermutation([s],n.shape.length),p=n;c!=null&&(p=Bt({inputs:{x:n},backend:e,attrs:{perm:c}}));let l=I.getInnerMostAxes(1,n.shape.length)[0];if(l!==p.shape.length-1)throw new Error(`backend.cumsum in CPU expects an inner-most axis=${p.shape.length-1} but got axis=${l}`);let u=Yt(p.dtype,"int32"),m=y.makeZerosTypedArray(y.sizeFromShape(p.shape),u),f=e.data.get(p.dataId).values,d=p.shape[p.shape.length-1],h=i?(x,b)=>x+d-b-1:(x,b)=>x+b;for(let x=0;x<f.length;x+=d)for(let b=0;b<d;b++){let S=h(x,b);if(b===0)m[S]=a?0:f[S];else{let N=h(x,b-1);m[S]=a?f[N]+m[N]:f[S]+m[N]}}let g=e.makeTensorInfo(p.shape,u,m);if(c!=null){let x=I.getUndoAxesPermutation(c),b=Bt({inputs:{x:g},backend:e,attrs:{perm:x}});return e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(p),b}return g}var JC={kernelName:As,backendName:"cpu",kernelFunc:VO};function MO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a,binaryOutput:i}=o;if(n.shape.length===1){let c=e.data.get(n.dataId).values,p=e.data.get(s.dataId).values,l=li(c,p,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,l)}else if(n.shape.length===2){let c=e.bufferSync(n),p=e.bufferSync(s),l=gl(c,p,a,i);return e.makeTensorInfo(l.shape,s.dtype,l.values)}throw new Error(`Error in denseBincount: input must be at most rank 2, but got rank${n.shape.length}.`)}var tT={kernelName:Ds,backendName:"cpu",kernelFunc:MO};function zO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockSize:s,dataFormat:a}=o;y.assert(a==="NHWC",()=>`Only NHWC dataFormat supported on CPU for depthToSpace. Got ${a}`);let i=n.shape[0],c=n.shape[1],p=n.shape[2],l=n.shape[3],u=c*s,m=p*s,f=l/(s*s),d=e.data.get(n.dataId).values,h=new Float32Array(i*u*m*f),g=0;for(let x=0;x<i;++x)for(let b=0;b<u;++b){let S=Math.floor(b/s),N=b%s;for(let k=0;k<m;++k){let $=Math.floor(k/s),R=k%s,A=(N*s+R)*f;for(let D=0;D<f;++D){let O=D+A+l*($+p*(S+c*x));h[g++]=d[O]}}}return e.makeTensorInfo([i,u,m,f],n.dtype,h)}var eT={kernelName:_s,backendName:"cpu",kernelFunc:zO};function Vd(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:c,dimRoundingMode:p}=o;W([n,s],"depthwiseConv2DNative");let l=y.computeStrides(n.shape),u=y.computeStrides(s.shape),m=c;m==null&&(m=[1,1]),y.assert(I.eitherStridesOrDilationsAreOne(a,m),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${a} and dilations '${m}'`);let f=I.computeConv2DInfo(n.shape,s.shape,a,m,i,p,!0),{filterHeight:d,filterWidth:h,dilationHeight:g,dilationWidth:x,padInfo:b}=f,S=b.left,N=b.top,k=f.outChannels/f.inChannels,$=new vt(f.outShape,n.dtype),R=e.data.get(n.dataId).values,A=e.data.get(s.dataId).values,D=$.values;for(let _=0;_<f.batchSize;++_){let O=_*l[0],L=_*$.strides[0];for(let B=0;B<f.outHeight;++B){let M=L+B*$.strides[1],V=B*f.strideHeight-N;for(let G=0;G<d;++G){let U=V+G*g;if(U<0||U>=f.inHeight)continue;let z=G*u[0],H=O+U*l[1];for(let q=0;q<f.outWidth;++q){let X=M+q*$.strides[2],Z=q*f.strideWidth-S;for(let j=0;j<h;++j){let J=Z+j*x;if(J<0||J>=f.inWidth)continue;let Y=z+j*u[1],et=H+J*f.inChannels,nt=X,ct=Y;for(let pt=0;pt<f.inChannels;++pt){let ht=R[et+pt];for(let bt=0;bt<k;++bt)D[nt+bt]+=ht*A[ct+bt];nt+=k,ct+=k}}}}}}return e.makeTensorInfo($.shape,$.dtype,$.values)}var rT={kernelName:Os,backendName:"cpu",kernelFunc:Vd};function WO(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,dilations:i,pad:c,dimRoundingMode:p,filterShape:l}=o;W([n,s],"depthwiseConv2dNativeBackpropFilter");let u=I.computeConv2DInfo(n.shape,l,a,i,c,p,!0),{strideHeight:m,strideWidth:f,filterHeight:d,filterWidth:h}=u,g=new vt(u.filterShape,"float32"),x=u.padInfo.left,b=u.padInfo.top,S=u.outChannels/u.inChannels,N=e.data.get(n.dataId).values,k=new vt(n.shape,n.dtype,N),$=e.data.get(s.dataId).values,R=new vt(s.shape,s.dtype,$);for(let A=0;A<d;++A){let D=Math.max(0,Math.ceil((b-A)/m)),_=Math.min(u.outHeight,(u.inHeight+b-A)/m);for(let O=0;O<h;++O){let L=Math.max(0,Math.ceil((x-O)/f)),B=Math.min(u.outWidth,(u.inWidth+x-O)/f);for(let M=0;M<u.outChannels;++M){let V=Math.trunc(M/S),G=M%S,U=0;for(let z=0;z<u.batchSize;++z)for(let H=D;H<_;++H){let q=A+H*m-b;for(let X=L;X<B;++X){let Z=O+X*f-x;U+=k.get(z,q,Z,V)*R.get(z,H,X,M)}}g.set(U,A,O,V,G)}}}return e.makeTensorInfo(g.shape,g.dtype,g.values)}var oT={kernelName:Ps,backendName:"cpu",kernelFunc:WO};function GO(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{strides:a,dilations:i,pad:c,dimRoundingMode:p,inputShape:l}=o;W([n,s],"depthwiseConv2DNativeBackpropInput");let u=y.computeStrides(n.shape),m=y.computeStrides(s.shape),f=I.computeConv2DInfo(l,s.shape,a,i,c,p,!0),d=new vt(f.inShape,"float32"),h=d.values,[g,x,b]=d.strides,S=e.data.get(n.dataId).values,[N,k,$]=u,R=e.data.get(s.dataId).values,[A,D,_]=m,{batchSize:O,filterHeight:L,filterWidth:B,inChannels:M,inHeight:V,inWidth:G,outChannels:U,outHeight:z,outWidth:H,strideHeight:q,strideWidth:X}=f,Z=L-1-f.padInfo.top,j=B-1-f.padInfo.left,J=U/M;for(let Y=0;Y<O;++Y)for(let et=0;et<M;++et)for(let nt=0;nt<V;++nt){let ct=nt-Z,pt=Math.max(0,Math.ceil(ct/q)),ht=Math.min(z,(L+ct)/q);for(let bt=0;bt<G;++bt){let Rt=bt-j,Ot=Math.max(0,Math.ceil(Rt/X)),Mt=Math.min(H,(B+Rt)/X),Gt=0;for(let Ft=pt;Ft<ht;++Ft){let jt=Ft*q-ct;for(let Qt=Ot;Qt<Mt;++Qt){let Dr=Qt*X-Rt,ie=N*Y+k*Ft+$*Qt,Yr=A*(L-1-jt)+D*(B-1-Dr)+_*et;for(let Oe=0;Oe<J;++Oe){let ko=et*J+Oe,ar=S[ie+ko],_r=R[Yr+Oe];Gt+=ar*_r}}}h[g*Y+x*nt+b*bt+et]=Gt}}return e.makeTensorInfo(d.shape,d.dtype,d.values)}var nT={kernelName:Ls,backendName:"cpu",kernelFunc:GO};function UO(r){let{inputs:t,backend:e}=r,{x:o}=t,n=y.sizeFromShape(o.shape),s=e.data.get(o.dataId).values,a=tt([n,n],o.dtype),i=a.values;for(let p=0;p<s.length;p++)i[p*n+p]=s[p];let c=[...o.shape,...o.shape];return e.makeTensorInfo(c,a.dtype,a.values)}var sT={kernelName:Bs,backendName:"cpu",kernelFunc:UO};var aT={kernelName:Vs,backendName:"cpu",kernelFunc:({inputs:r,backend:t,attrs:e})=>{let{x:o,filter:n}=r,{strides:s,pad:a,dilations:i}=e,c=t,p=c.data.get(o.dataId).values,l=o.shape.length,u=c.data.get(n.dataId).values,m=n.shape.length,{batchSize:f,inHeight:d,inWidth:h,inChannels:g,outHeight:x,outWidth:b,padInfo:S,strideHeight:N,strideWidth:k,filterHeight:$,filterWidth:R,dilationHeight:A,dilationWidth:D,outShape:_}=I.computeDilation2DInfo(o.shape,n.shape,s,a,"NHWC",i),O=y.sizeFromShape(_),L=_.length,B=y.getArrayFromDType(o.dtype,O);for(let V=0;V<f;++V)for(let G=0;G<x;++G){let U=G*N-S.top;for(let z=0;z<b;++z){let H=z*k-S.left;for(let q=0;q<g;++q){let X=Number.MIN_SAFE_INTEGER;for(let j=0;j<$;++j){let J=U+j*A;if(J>=0&&J<d)for(let Y=0;Y<R;++Y){let et=H+Y*D;if(et>=0&&et<h){let nt=y.locToIndex([V,J,et,q],l,y.computeStrides(o.shape)),ct=y.locToIndex([j,Y,q],m,y.computeStrides(n.shape)),pt=p[nt]+u[ct];pt>X&&(X=pt)}}}let Z=y.locToIndex([V,G,z,q],L,y.computeStrides(_));B[Z]=X}}}return{dataId:c.write(y.toTypedArray(B,o.dtype),_,o.dtype),shape:_,dtype:o.dtype}}};var iT={kernelName:rf,backendName:"cpu",kernelFunc:({inputs:r,backend:t,attrs:e})=>{let{x:o,filter:n,dy:s}=r,{strides:a,pad:i,dilations:c}=e,p=t,l=y.toNestedArray(o.shape,p.data.get(o.dataId).values),u=y.toNestedArray(n.shape,p.data.get(n.dataId).values),{batchSize:m,inHeight:f,inWidth:d,inChannels:h,outHeight:g,outWidth:x,padInfo:b,strideHeight:S,strideWidth:N,filterHeight:k,filterWidth:$,dilationHeight:R,dilationWidth:A,outShape:D}=I.computeDilation2DInfo(o.shape,n.shape,a,i,"NHWC",c);y.assert(s.rank===D.length,()=>`Error in ${rf}, dy must have the same rank as output ${D.length}, but got ${s.rank}`);let _=y.toNestedArray(D,p.data.get(s.dataId).values),O=y.makeZerosNestedTypedArray(n.shape,n.dtype);for(let B=0;B<m;++B)for(let M=0;M<g;++M){let V=M*S-b.top;for(let G=0;G<x;++G){let U=G*N-b.left;for(let z=0;z<h;++z){let H=Number.MIN_SAFE_INTEGER,q=0,X=0;for(let Z=0;Z<k;++Z){let j=V+Z*R;if(j>=0&&j<f)for(let J=0;J<$;++J){let Y=U+J*A;if(Y>=0&&Y<d){let et=l[B][j][Y][z]+u[Z][J][z];et>H&&(H=et,q=Z,X=J)}}}O[q][X][z]+=_[B][M][G][z]}}}return{dataId:p.write(y.toTypedArray(O,o.dtype),n.shape,n.dtype),shape:n.shape,dtype:n.dtype}}};var cT={kernelName:ef,backendName:"cpu",kernelFunc:({inputs:r,backend:t,attrs:e})=>{let{x:o,filter:n,dy:s}=r,{strides:a,pad:i,dilations:c}=e,p=t,l=y.toNestedArray(o.shape,p.data.get(o.dataId).values),u=y.toNestedArray(n.shape,p.data.get(n.dataId).values),{batchSize:m,inHeight:f,inWidth:d,inChannels:h,outHeight:g,outWidth:x,padInfo:b,strideHeight:S,strideWidth:N,filterHeight:k,filterWidth:$,dilationHeight:R,dilationWidth:A,outShape:D}=I.computeDilation2DInfo(o.shape,n.shape,a,i,"NHWC",c);y.assert(s.rank===D.length,()=>`Error in ${ef}, dy must have the same rank as output ${D.length}, but got ${s.rank}`);let _=y.toNestedArray(D,p.data.get(s.dataId).values),O=y.makeZerosNestedTypedArray(o.shape,o.dtype);for(let B=0;B<m;++B)for(let M=0;M<g;++M){let V=M*S-b.top;for(let G=0;G<x;++G){let U=G*N-b.left;for(let z=0;z<h;++z){let H=Number.MIN_SAFE_INTEGER,q=V<0?0:V,X=U<0?0:U;for(let Z=0;Z<k;++Z){let j=V+Z*R;if(j>=0&&j<f)for(let J=0;J<$;++J){let Y=U+J*A;if(Y>=0&&Y<d){let et=l[B][j][Y][z]+u[Z][J][z];et>H&&(H=et,q=j,X=Y)}}}O[B][q][X][z]+=_[B][M][G][z]}}}return{dataId:p.write(y.toTypedArray(O,o.dtype),o.shape,o.dtype),shape:o.shape,dtype:o.dtype}}};function Hr(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;W(n,"sum");let i;n.dtype==="bool"?i=Je({inputs:{x:n},backend:e,attrs:{dtype:"int32"}}):i=le({inputs:{x:n},backend:e});let c=i.shape.length,p=y.parseAxisParam(s,i.shape),l=I.getAxesPermutation(p,c),u=p,m=i;l!=null&&(m=Bt({inputs:{x:i},backend:e,attrs:{perm:l}}),u=I.getInnerMostAxes(u.length,c)),I.assertAxesAreInnerMostDims("sum",u,m.shape.length);let[f,d]=I.computeOutAndReduceShapes(m.shape,u),h=I.upcastType(m.dtype,"int32"),g=ci(e,f,h),x=y.sizeFromShape(d),b=e.data.get(g.dataId).values,S=e.data.get(m.dataId).values;for(let N=0;N<b.length;++N){let k=N*x,$=0;for(let R=0;R<x;++R)$+=S[k+R];b[N]=$}if(a){let N=I.expandShapeToKeepDim(g.shape,p),k=g;g=dt({inputs:{x:g},backend:e,attrs:{shape:N}}),e.disposeIntermediateTensorInfo(k)}return e.disposeIntermediateTensorInfo(i),l!=null&&e.disposeIntermediateTensorInfo(m),g}var pT={kernelName:"Sum",backendName:"cpu",kernelFunc:Hr};function HO(r){let{inputs:t,backend:e,attrs:o}=r,{equation:n}=o,s=t,{allDims:a,summedDims:i,idDims:c}=I.decodeEinsumEquation(n,s.length);I.checkEinsumDimSizes(a.length,c,s);let{path:p,steps:l}=I.getEinsumComputePath(i,c),u=l.length,m=null,f=a.length,d=[];for(let h=0;h<u;++h){for(let g of l[h]){let{permutationIndices:x,expandDims:b}=I.getEinsumPermutation(f,c[g]),S;I.isIdentityPermutation(x)?S=s[g]:(S=Bt({inputs:{x:s[g]},backend:e,attrs:{perm:x}}),d.push(S));let N=S.shape.slice();for(let k=0;k<b.length;++k)N.splice(b[k],0,1);y.arraysEqual(S.shape,N)||(S=dt({inputs:{x:S},backend:e,attrs:{shape:N}}),d.push(S)),m===null?m=S:(m=Xn({inputs:{a:S,b:m},backend:e}),d.push(m))}h<u-1&&(p[h]>=0&&(m=Hr({inputs:{x:m},backend:e,attrs:{axis:p[h]-(a.length-f),keepDims:!1}}),d.push(m)),f--)}for(let h of d)h!==m&&e.disposeIntermediateTensorInfo(h);return m}var lT={kernelName:Ms,backendName:"cpu",kernelFunc:HO};function KO(r){let{inputs:t,backend:e}=r,{dy:o,y:n}=t;W([o,n],"eluGrad");let s=new Float32Array(y.sizeFromShape(n.shape)),a=e.data.get(n.dataId).values,i=e.data.get(o.dataId).values;for(let c=0;c<a.length;++c){let p=a[c];p>=1?s[c]=i[c]:s[c]=i[c]*(p+1)}return e.makeTensorInfo(n.shape,"float32",s)}var uT={kernelName:Uc,backendName:"cpu",kernelFunc:KO};var qO=I.ERF_P,XO=I.ERF_A1,jO=I.ERF_A2,YO=I.ERF_A3,ZO=I.ERF_A4,QO=I.ERF_A5,JO=it("Erf",r=>{let t=Math.sign(r),e=Math.abs(r),o=1/(1+qO*e);return t*(1-((((QO*o+ZO)*o+YO)*o+jO)*o+XO)*o*Math.exp(-e*e))}),mT={kernelName:"Erf",backendName:"cpu",kernelFunc:JO};function di(r){let{inputs:t,backend:e,attrs:o}=r,{input:n}=t,{dim:s}=o,a=n.shape.length,i=n.shape.slice(),c=s;return s<0&&(y.assert(-(a+1)<=s,()=>`Axis must be in the interval [${-(a+1)}, ${a}]`),c=a+s+1),i.splice(c,0,1),dt({inputs:{x:n},backend:e,attrs:{shape:i}})}var fT={kernelName:zs,backendName:"cpu",kernelFunc:di};var tP=gt((r,t)=>r/t),gc=Ct(zo,tP),xc={kernelName:zo,backendName:"cpu",kernelFunc:gc};function Pl(r,t,e){let o=r.shape,n=o[0],s=o[1],a=e.data.get(r.dataId),i=a.complexTensorInfos.real,c=a.complexTensorInfos.imag,p=[n,s],l=y.sizeFromShape(p),u=y.getTypedArrayFromDType("float32",l),m=y.getTypedArrayFromDType("float32",l);for(let g=0;g<n;g++){let x=rr({inputs:{x:i},backend:e,attrs:{begin:[g,0],size:[1,s]}}),b=rr({inputs:{x:c},backend:e,attrs:{begin:[g,0],size:[1,s]}}),S=ee({inputs:{real:x,imag:b},backend:e}),{real:N,imag:k}=eP(S,t,e),$=I.mergeRealAndImagArrays(N,k);for(let R=0;R<s;R++){let A=I.getComplexWithIndex($,R);u[g*s+R]=A.real,m[g*s+R]=A.imag}e.disposeIntermediateTensorInfo(x),e.disposeIntermediateTensorInfo(b),e.disposeIntermediateTensorInfo(S)}let f=e.makeTensorInfo(p,"float32",u),d=e.makeTensorInfo(p,"float32",m),h=ee({inputs:{real:f,imag:d},backend:e});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),h}function eP(r,t,e){let o=y.sizeFromShape(r.shape),n=e.data.get(r.dataId),s=e.data.get(n.complexTensorInfos.real.dataId).values,a=e.data.get(n.complexTensorInfos.imag.dataId).values;if(rP(o)){let i=Md(s,a,o,t,e),c=[r.shape[0],r.shape[1]];if(t){let p=e.makeTensorInfo(c,"float32",i.real),l=e.makeTensorInfo(c,"float32",i.imag),u=e.makeTensorInfo([],"float32",y.createScalarValue(o,"float32")),m=le({inputs:{x:u},backend:e}),f=xc.kernelFunc({inputs:{a:p,b:u},backend:e}),d=xc.kernelFunc({inputs:{a:l,b:m},backend:e}),h=e.data.get(f.dataId).values,g=e.data.get(d.dataId).values;return e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(l),e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),{real:h,imag:g}}return i}else{let i=I.mergeRealAndImagArrays(s,a),c=oP(i,o,t);return I.splitRealAndImagArrays(c)}}function rP(r){return(r&r-1)===0}function Md(r,t,e,o,n){if(e===1)return{real:r,imag:t};let s=I.mergeRealAndImagArrays(r,t),a=e/2,i=I.complexWithEvenIndex(s),c=i.real,p=i.imag,l=[c.length],u=n.makeTensorInfo(l,"float32",c),m=n.makeTensorInfo(l,"float32",p),f=ee({inputs:{real:u,imag:m},backend:n}),d=I.complexWithOddIndex(s),h=d.real,g=d.imag,x=[h.length],b=n.makeTensorInfo(x,"float32",h),S=n.makeTensorInfo(x,"float32",g),N=ee({inputs:{real:b,imag:S},backend:n}),k=Md(c,p,a,o,n),$=k.real,R=k.imag,A=[$.length],D=n.makeTensorInfo(A,"float32",$),_=n.makeTensorInfo(A,"float32",R),O=ee({inputs:{real:D,imag:_},backend:n}),L=Md(h,g,a,o,n),B=L.real,M=L.imag,V=[B.length],G=n.makeTensorInfo(V,"float32",B),U=n.makeTensorInfo(V,"float32",M),z=ee({inputs:{real:G,imag:U},backend:n}),H=I.exponents(e,o),q=[H.real.length],X=n.makeTensorInfo(q,"float32",H.real),Z=n.makeTensorInfo(q,"float32",H.imag),j=ee({inputs:{real:X,imag:Z},backend:n}),J=Xn({inputs:{a:j,b:z},backend:n}),Y=Er({inputs:{a:O,b:J},backend:n}),et=dc({inputs:{a:O,b:J},backend:n}),nt=Qe({inputs:{input:Y},backend:n}),ct=Qe({inputs:{input:et},backend:n}),pt=$r({inputs:{input:Y},backend:n}),ht=$r({inputs:{input:et},backend:n}),bt=To({inputs:[nt,ct],backend:n,attrs:{axis:0}}),Rt=To({inputs:[pt,ht],backend:n,attrs:{axis:0}}),Ot=n.data.get(bt.dataId).values,Mt=n.data.get(Rt.dataId).values;return n.disposeIntermediateTensorInfo(u),n.disposeIntermediateTensorInfo(m),n.disposeIntermediateTensorInfo(f),n.disposeIntermediateTensorInfo(b),n.disposeIntermediateTensorInfo(S),n.disposeIntermediateTensorInfo(N),n.disposeIntermediateTensorInfo(D),n.disposeIntermediateTensorInfo(_),n.disposeIntermediateTensorInfo(O),n.disposeIntermediateTensorInfo(G),n.disposeIntermediateTensorInfo(U),n.disposeIntermediateTensorInfo(z),n.disposeIntermediateTensorInfo(X),n.disposeIntermediateTensorInfo(Z),n.disposeIntermediateTensorInfo(j),n.disposeIntermediateTensorInfo(J),n.disposeIntermediateTensorInfo(Y),n.disposeIntermediateTensorInfo(et),n.disposeIntermediateTensorInfo(nt),n.disposeIntermediateTensorInfo(pt),n.disposeIntermediateTensorInfo(ct),n.disposeIntermediateTensorInfo(ht),n.disposeIntermediateTensorInfo(bt),n.disposeIntermediateTensorInfo(Rt),{real:Ot,imag:Mt}}function oP(r,t,e){let o=new Float32Array(t*2);for(let n=0;n<t;n++){let s=0,a=0;for(let i=0;i<t;i++){let c=I.exponent(n*i,t,e),p=I.getComplexWithIndex(r,i);s+=p.real*c.real-p.imag*c.imag,a+=p.real*c.imag+p.imag*c.real}e&&(s/=t,a/=t),I.assignToTypedArray(o,s,a,n)}return o}function nP(r){let{inputs:t,backend:e}=r,{input:o}=t,n=y.sizeFromShape(o.shape),s=o.shape[o.shape.length-1],a=n/s,i=dt({inputs:{x:o},backend:e,attrs:{shape:[a,s]}}),c=Pl(i,!1,e),p=dt({inputs:{x:c},backend:e,attrs:{shape:o.shape}});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(c),p}var dT={kernelName:"FFT",backendName:"cpu",kernelFunc:nP};function yc(r){let{backend:t,attrs:e}=r,{shape:o,value:n,dtype:s}=e,a=s||y.inferDtype(n),i=y.getArrayFromDType(a,y.sizeFromShape(o));return sP(i,n,a),t.makeTensorInfo(o,a,i)}var hT={kernelName:Ws,backendName:"cpu",kernelFunc:yc};function sP(r,t,e){r.fill(t)}var gT={kernelName:Gs,backendName:"cpu",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{image:o}=r,n=e,s=y.getTypedArrayFromDType(o.dtype,y.sizeFromShape(o.shape)),[a,i,c,p]=o.shape,l=n.data.get(o.dataId).values;for(let m=0;m<a;m++){let f=m*c*i*p;for(let d=0;d<i;d++){let h=d*(c*p);for(let g=0;g<c;g++){let x=g*p;for(let b=0;b<p;b++){let S=Math.round(c-g-1),N=f+h+x+b,k=l[N];if(S>=0&&S<c){let $=S*p,R=f+h+$+b;k=l[R]}s[N]=k}}}}return{dataId:n.write(s,o.shape,o.dtype),shape:o.shape,dtype:o.dtype}}};var aP=gt((r,t)=>Math.floor(r/t)),iP=Ct(Ho,aP,null,"int32"),xT={kernelName:Ho,backendName:"cpu",kernelFunc:iP};function cP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:c,pad:p,dataFormat:l,dilations:u,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,h=Bd({inputs:{x:n,filter:s},backend:e,attrs:{strides:c,pad:p,dataFormat:l,dilations:u,dimRoundingMode:m}});if(a){let g=h;if(l==="NCHW"&&a.shape.length===1&&a.shape[0]!==1){let x=dt({inputs:{x:a},backend:e,attrs:{shape:[a.shape[0],1,1]}});h=Er({inputs:{a:h,b:x},backend:e}),e.disposeIntermediateTensorInfo(x)}else h=Er({inputs:{a:h,b:a},backend:e});e.disposeIntermediateTensorInfo(g)}if(f){let g=h;if(l==="NCHW"&&f==="prelu"&&i.shape.length===1&&i.shape[0]!==1){let x=dt({inputs:{x:i},backend:e,attrs:{shape:[i.shape[0],1,1]}});h=jn(e,h,f,x,d),e.disposeIntermediateTensorInfo(x)}else h=jn(e,h,f,i,d);e.disposeIntermediateTensorInfo(g)}return h}var yT={kernelName:wn,backendName:"cpu",kernelFunc:cP};function pP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:c,pad:p,dataFormat:l,dilations:u,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,h=Vd({inputs:{x:n,filter:s},backend:e,attrs:{strides:c,pad:p,dataFormat:l,dilations:u,dimRoundingMode:m}});if(a){let g=h;h=Er({inputs:{a:h,b:a},backend:e}),e.disposeIntermediateTensorInfo(g)}if(f){let g=h;h=jn(e,h,f,i,d),e.disposeIntermediateTensorInfo(g)}return h}var bT={kernelName:Nn,backendName:"cpu",kernelFunc:pP};function lP(r){let{inputs:t,backend:e}=r,{params:o,indices:n}=t,s=y.sizeFromShape(o.shape),a=n.shape,i=a[a.length-1],[c,p,l,u]=I.prepareAndValidate(o,n);if(p===0)return e.makeTensorInfo(c,o.dtype,[]);let m=e.data.get(n.dataId).values,f=e.bufferSync(o),d=yl(m,f,o.dtype,p,i,l,u,o.shape,s);return e.makeTensorInfo(c,o.dtype,d.values)}var CT={kernelName:Ks,backendName:"cpu",kernelFunc:lP};function uP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,indices:s}=t,{axis:a,batchDims:i}=o;W([n,s],"gatherV2");let c=y.parseAxisParam(a,n.shape)[0],p=e.data.get(s.dataId).values,l=n.shape[c];for(let N=0;N<p.length;++N){let k=p[N];y.assert(k<=l-1&&k>=0,()=>`GatherV2: the index value ${k} is not in [0, ${l-1}]`)}let u=i;i==null&&(u=0);let m=y.sizeFromShape(s.shape),f=I.segment_util.collectGatherOpShapeInfo(n,s,c,u),d=dt({inputs:{x:n},backend:e,attrs:{shape:[f.batchSize,f.outerSize,f.dimSize,f.sliceSize]}}),h=dt({inputs:{x:s},backend:e,attrs:{shape:[f.batchSize,m/f.batchSize]}}),g=[f.batchSize,f.outerSize,m/f.batchSize,f.sliceSize],x=e.bufferSync(h),b=e.bufferSync(d),S=bl(b,x,g);return e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(h),e.makeTensorInfo(f.outputShape,S.dtype,S.values)}var TT={kernelName:Hs,backendName:"cpu",kernelFunc:uP};function mP(r){let{inputs:t,backend:e}=r,{input:o}=t,n=y.sizeFromShape(o.shape),s=o.shape[o.shape.length-1],a=n/s,i=dt({inputs:{x:o},backend:e,attrs:{shape:[a,s]}}),c=Pl(i,!0,e),p=dt({inputs:{x:c},backend:e,attrs:{shape:o.shape}});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(c),p}var ST={kernelName:qs,backendName:"cpu",kernelFunc:mP};var fP=it(Xo,r=>Number.isFinite(r)?1:0,"bool"),wT={kernelName:Xo,backendName:"cpu",kernelFunc:fP};var dP=it(jo,r=>Math.abs(r)===1/0?1:0,"bool"),NT={kernelName:jo,backendName:"cpu",kernelFunc:dP};var hP=it(Yo,r=>Number.isNaN(r)?1:0,"bool"),IT={kernelName:Yo,backendName:"cpu",kernelFunc:hP};function gP(r){let{backend:t,attrs:e}=r,{start:o,stop:n,num:s}=e,a=Cl(o,n,s);return t.makeTensorInfo([a.length],"float32",a)}var vT={kernelName:Ys,backendName:"cpu",kernelFunc:gP};var xP=it(Jo,r=>Math.log1p(r)),kT={kernelName:Jo,backendName:"cpu",kernelFunc:xP};var yP=gt((r,t)=>r&&t),bP=Ct(tn,yP,null,"bool"),ET={kernelName:tn,backendName:"cpu",kernelFunc:bP};var CP=it(en,r=>r?0:1,"bool"),$T={kernelName:en,backendName:"cpu",kernelFunc:CP};var TP=gt((r,t)=>r||t),SP=Ct(rn,TP,null,"bool"),RT={kernelName:rn,backendName:"cpu",kernelFunc:SP};function wP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{depthRadius:s,bias:a,alpha:i,beta:c}=o;W(n,"LRN");let p=n.shape[3],l=p-1,u=e.data.get(n.dataId).values,m=y.sizeFromShape(n.shape),f=new Float32Array(m);function d(h){let g=h%p,x=h-g+Math.max(0,g-s),b=h-g+Math.min(g+s,l),S=0;for(;x<=b;x++){let N=u[x];S+=N*N}return S}for(let h=0;h<m;h++){let g=d(h),x=u[h]*Math.pow(a+i*g,-c);f[h]=x}return e.makeTensorInfo(n.shape,n.dtype,f)}var AT={kernelName:"LRN",backendName:"cpu",kernelFunc:wP};function NP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,y:s,dy:a}=t,{depthRadius:i,bias:c,alpha:p,beta:l}=o;W(a,"LRNGrad");let u=y.sizeFromShape(a.shape),m=a.shape[3],f=e.data.get(a.dataId).values,d=e.data.get(n.dataId).values,h=e.data.get(s.dataId).values,g=new Float32Array(u),x=u;for(let b=0;b<x;b++){let S=b%m,N=b-S+Math.max(0,S-i),k=b-S+Math.min(m,S+i+1),$=0;for(let R=N;R<k;R++)$+=Math.pow(d[R],2);$=p*$+c;for(let R=N;R<k;R++){let A=-2*p*l*d[R]*h[b]/$;b===R&&(A+=Math.pow($,-l)),A*=f[b],g[R]+=A}}return e.makeTensorInfo(a.shape,n.dtype,g)}var FT={kernelName:Hc,backendName:"cpu",kernelFunc:NP};function zd(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reductionIndices:s,keepDims:a}=o,i=e,c=n.shape,p=c.length,l=y.parseAxisParam(s,c),u=l,m=I.getAxesPermutation(u,p),f=i.data.get(n.dataId).values;if(m!=null){let N=new Array(p);for(let k=0;k<N.length;k++)N[k]=c[m[k]];f=ui(f,c,n.dtype,m,N),u=I.getInnerMostAxes(u.length,p),c=N}W(n,"max"),I.assertAxesAreInnerMostDims("max",u,p);let[d,h]=I.computeOutAndReduceShapes(c,u),g=y.sizeFromShape(h),x=Tl(f,g,d,n.dtype),b=i.write(x,d,n.dtype),S=d;return a&&(S=I.expandShapeToKeepDim(d,l)),{dataId:b,shape:S,dtype:n.dtype}}var DT={kernelName:"Max",backendName:"cpu",kernelFunc:zd};function IP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;W(n,"maxPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:c}=o,p=1;y.assert(I.eitherStridesOrDilationsAreOne(a,p),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${p}'`);let l=I.computePool2DInfo(n.shape,s,a,p,i,c),u;if(l.filterWidth===1&&l.filterHeight===1&&y.arraysEqual(l.inShape,l.outShape))u=le({inputs:{x:n},backend:e});else{let m=e.data.get(n.dataId).values,f=y.computeStrides(n.shape),d=fi(m,n.shape,n.dtype,f,l,"max");u=e.makeTensorInfo(l.outShape,n.dtype,d.values)}return u}var _T={kernelName:Zs,backendName:"cpu",kernelFunc:IP};function vP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dimRoundingMode:c,dataFormat:p}=o;W(n,"maxPool3d");let l=I.computePool3DInfo(n.shape,s,a,1,i,c,p),u=e.data.get(n.dataId).values,m=Ol(u,n.shape,n.dtype,y.computeStrides(n.shape),l,"max");return e.makeTensorInfo(m.shape,"float32",m.values)}var OT={kernelName:Qs,backendName:"cpu",kernelFunc:vP};function kP(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,{filterSize:a,strides:i,pad:c,dimRoundingMode:p}=o;W([n,s],"maxPool3DGrad");let l=I.computePool3DInfo(s.shape,a,i,1,c,p),u=e.bufferSync(s),m=RC(u,l),f=l.strideDepth,d=l.strideHeight,h=l.strideWidth,g=l.dilationDepth,x=l.dilationHeight,b=l.dilationWidth,S=l.effectiveFilterDepth,N=l.effectiveFilterHeight,k=l.effectiveFilterWidth,$=S-1-l.padInfo.front,R=k-1-l.padInfo.left,A=N-1-l.padInfo.top,D=tt(s.shape,"float32"),_=e.bufferSync(n);for(let O=0;O<l.batchSize;++O)for(let L=0;L<l.inChannels;++L)for(let B=0;B<l.inDepth;++B)for(let M=0;M<l.inHeight;++M)for(let V=0;V<l.inWidth;++V){let G=B-$,U=M-A,z=V-R,H=0;for(let q=0;q<S;q+=g){let X=(G+q)/f;if(!(X<0||X>=l.outDepth||Math.floor(X)!==X))for(let Z=0;Z<N;Z+=x){let j=(U+Z)/d;if(!(j<0||j>=l.outHeight||Math.floor(j)!==j))for(let J=0;J<k;J+=b){let Y=(z+J)/h;if(Y<0||Y>=l.outWidth||Math.floor(Y)!==Y)continue;let et=S*N*k-1-m.get(O,X,j,Y,L),nt=q*N*k+Z*k+J,ct=et===nt?1:0;if(ct===0)continue;let pt=_.get(O,X,j,Y,L);H+=pt*ct}}}D.set(H,O,B,M,V,L)}return e.makeTensorInfo(D.shape,D.dtype,D.values)}var PT={kernelName:qc,backendName:"cpu",kernelFunc:kP};function EP(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s,output:a}=t,i=s;W([s,a],"maxPoolGrad");let{filterSize:c,strides:p,pad:l,dimRoundingMode:u}=o,m=I.computePool2DInfo(i.shape,c,p,1,l,u),f=e.data.get(i.dataId).values,d=tt(m.outShape,i.dtype,_l(f,i.shape,i.dtype,m).values),h=m.strideHeight,g=m.strideWidth,x=m.dilationHeight,b=m.dilationWidth,S=m.effectiveFilterHeight,N=m.effectiveFilterWidth,k=N-1-m.padInfo.left,$=S-1-m.padInfo.top,R=tt(i.shape,"float32"),A=e.data.get(n.dataId).values,D=tt(n.shape,"float32",A);for(let _=0;_<m.batchSize;++_)for(let O=0;O<m.inChannels;++O)for(let L=0;L<m.inHeight;++L)for(let B=0;B<m.inWidth;++B){let M=L-$,V=B-k,G=0;for(let U=0;U<S;U+=x){let z=(M+U)/h;if(!(z<0||z>=m.outHeight||Math.floor(z)!==z))for(let H=0;H<N;H+=b){let q=(V+H)/g;if(q<0||q>=m.outWidth||Math.floor(q)!==q)continue;let X=S*N-1-d.get(_,z,q,O),Z=U*N+H,j=X===Z?1:0;if(j===0)continue;let J=D.get(_,z,q,O);G+=J*j}}R.set(G,_,L,B,O)}return e.makeTensorInfo(R.shape,R.dtype,R.values)}var LT={kernelName:Kc,backendName:"cpu",kernelFunc:EP};function BT(r,t,e,o,n){let s=y.computeStrides(t),a=fi(r,t,e,s,n,"max"),i=_l(r,t,e,n,!0,o);return[a.values,i.values]}var VT={kernelName:Js,backendName:"cpu",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{x:o}=r,{filterSize:n,strides:s,pad:a,includeBatchInIndex:i}=t,c=e;W(o,"MaxPoolWithArgmax");let p=c.data.get(o.dataId).values,l=I.computePool2DInfo(o.shape,n,s,[1,1],a),[u,m]=BT(p,o.shape,o.dtype,i,l),f=c.write(u,l.outShape,o.dtype),d=c.write(m,l.outShape,o.dtype);return[{dataId:f,shape:l.outShape,dtype:o.dtype},{dataId:d,shape:l.outShape,dtype:"int32"}]}};function $P(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=y.parseAxisParam(s,n.shape),p=I.computeOutAndReduceShapes(n.shape,i)[1],l=y.sizeFromShape(p),u=[],m=e.makeTensorInfo([],"float32",new Float32Array([l]));u.push(m);let f=Je({inputs:{x:n},backend:e,attrs:{dtype:"float32"}});u.push(f);let d=gc({inputs:{a:f,b:m},backend:e});u.push(d);let h=Hr({inputs:{x:d},backend:e,attrs:{axis:s,keepDims:a}});return u.forEach(g=>e.disposeIntermediateTensorInfo(g)),h}var MT={kernelName:ta,backendName:"cpu",kernelFunc:$P};function RP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;W(n,"min");let i=y.parseAxisParam(s,n.shape),c=i,p=I.getAxesPermutation(c,n.shape.length),l=n;p!=null&&(l=Bt({inputs:{x:n},backend:e,attrs:{perm:p}}),c=I.getInnerMostAxes(c.length,n.shape.length)),I.assertAxesAreInnerMostDims("min",c,l.shape.length);let[u,m]=I.computeOutAndReduceShapes(l.shape,c),f=y.sizeFromShape(m),d=y.makeZerosTypedArray(y.sizeFromShape(u),l.dtype),h=e.data.get(l.dataId).values;for(let x=0;x<d.length;++x){let b=x*f,S=h[b];for(let N=0;N<f;++N){let k=h[b+N];(Number.isNaN(k)||k<S)&&(S=k)}d[x]=S}p!=null&&e.disposeIntermediateTensorInfo(l);let g=e.makeTensorInfo(u,l.dtype,d);if(a){let x=I.expandShapeToKeepDim(u,i),b=dt({inputs:{x:g},backend:e,attrs:{shape:x}});return e.disposeIntermediateTensorInfo(g),b}return g}var zT={kernelName:"Min",backendName:"cpu",kernelFunc:RP};function AP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{paddings:s,mode:a}=o;W(n,"mirrorPad");let i=s.map((S,N)=>S[0]+n.shape[N]+S[1]),c=s.map(S=>S[0]),p=s.map((S,N)=>S[0]+n.shape[N]),l=a==="reflect"?0:1,u=e.data.get(n.dataId).values,m=n.shape.length,f=y.computeStrides(n.shape),d=y.sizeFromShape(i),h=i.length,g=y.computeStrides(i),x=y.getTypedArrayFromDType(n.dtype,d);for(let S=0;S<d;S++){let N=y.indexToLoc(S,h,g);for(let $=0;$<h;$++)N[$]<c[$]?N[$]=c[$]*2-N[$]-l:N[$]>=p[$]&&(N[$]=(p[$]-1)*2-N[$]+l);N=N.map(($,R)=>$-c[R]);let k=y.locToIndex(N,m,f);x[S]=u[k]}return{dataId:e.write(x,i,n.dtype),shape:i,dtype:n.dtype}}var WT={kernelName:ea,backendName:"cpu",kernelFunc:AP};var FP=gt(((r,t)=>{let e=r%t;return r<0&&t<0||r>=0&&t>=0?e:(e+t)%t})),DP=Ct("Mod",FP),GT={kernelName:"Mod",backendName:"cpu",kernelFunc:DP};var HT=Hm(Zf());function Wd(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{dim:s}=o,a=n.shape.length,i=s;if(i===-1&&(i=a-1),i!==a-1)throw Error(`Softmax along a non-last dimension is not yet supported. Logits was rank ${a} and dim was ${i}`);let c=y.parseAxisParam([i],n.shape),p=zd({inputs:{x:n},backend:e,attrs:{reductionIndices:c,keepDims:!1}}),l=I.expandShapeToKeepDim(p.shape,c),u=dt({inputs:{x:p},backend:e,attrs:{shape:l}}),m=dc({inputs:{a:n,b:u},backend:e}),f=ud({inputs:{x:m},backend:e}),d=Hr({inputs:{x:f},backend:e,attrs:{axis:c,keepDims:!1}}),h=dt({inputs:{x:d},backend:e,attrs:{shape:l}}),g=gc({inputs:{a:f,b:h},backend:e});return e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(h),g}var UT={kernelName:va,backendName:"cpu",kernelFunc:Wd};function _P(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{numSamples:s,seed:a,normalized:i}=o;W(n,"multinomial");let c=i?n:Wd({inputs:{logits:n},backend:e,attrs:{dim:-1}}),p=c.shape[0],l=c.shape[1],u=e.data.get(c.dataId).values,m=[p,s],f=y.makeZerosTypedArray(y.sizeFromShape(m),"int32");for(let d=0;d<p;++d){let h=d*l,g=new Float32Array(l-1);g[0]=u[h];for(let S=1;S<g.length;++S)g[S]=g[S-1]+u[h+S];let x=HT.alea(a.toString()),b=d*s;for(let S=0;S<s;++S){let N=x();f[b+S]=g.length;for(let k=0;k<g.length;k++)if(N<g[k]){f[b+S]=k;break}}}return i||e.disposeIntermediateTensorInfo(c),e.makeTensorInfo(m,"int32",f)}var KT={kernelName:ra,backendName:"cpu",kernelFunc:_P};var OP=pe.nonMaxSuppressionV3Impl;function PP(r){let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:c}=o;W(n,"NonMaxSuppression");let p=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,{selectedIndices:u}=OP(p,l,a,i,c);return e.makeTensorInfo([u.length],"int32",new Int32Array(u))}var qT={kernelName:oa,backendName:"cpu",kernelFunc:PP};var LP=pe.nonMaxSuppressionV4Impl;function BP(r){let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:c,padToMaxOutputSize:p}=o;W(n,"NonMaxSuppressionPadded");let l=e.data.get(n.dataId).values,u=e.data.get(s.dataId).values,{selectedIndices:m,validOutputs:f}=LP(l,u,a,i,c,p);return[e.makeTensorInfo([m.length],"int32",new Int32Array(m)),e.makeTensorInfo([],"int32",new Int32Array([f]))]}var XT={kernelName:na,backendName:"cpu",kernelFunc:BP};var VP=pe.nonMaxSuppressionV5Impl;function MP(r){let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:c,softNmsSigma:p}=o;W(n,"NonMaxSuppressionWithScore");let l=e.data.get(n.dataId).values,u=e.data.get(s.dataId).values,m=a,f=i,d=c,h=p,{selectedIndices:g,selectedScores:x}=VP(l,u,m,f,d,h);return[e.makeTensorInfo([g.length],"int32",new Int32Array(g)),e.makeTensorInfo([x.length],"float32",new Float32Array(x))]}var jT={kernelName:sa,backendName:"cpu",kernelFunc:MP};function zP(r){let{inputs:t,backend:e,attrs:o}=r,{indices:n}=t,{dtype:s,depth:a,onValue:i,offValue:c}=o;W(n,"oneHot");let p=y.sizeFromShape(n.shape),l=new Float32Array(p*a);l.fill(c);let u=e.data.get(n.dataId).values;for(let m=0;m<p;++m)u[m]>=0&&u[m]<a&&(l[m*a+u[m]]=i);return e.makeTensorInfo([...n.shape,a],s,l)}var YT={kernelName:ia,backendName:"cpu",kernelFunc:zP};function bc(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="string")throw new Error("zerosLike is not supported for string tensors");if(o.dtype==="complex64"){let n=Qe({inputs:{input:o},backend:e}),s=bc({inputs:{x:n},backend:e}),a=$r({inputs:{input:o},backend:e}),i=bc({inputs:{x:a},backend:e}),c=ee({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),c}else return yc({backend:e,attrs:{shape:o.shape,value:0,dtype:o.dtype}})}var ZT={kernelName:za,backendName:"cpu",kernelFunc:bc};function QT(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="string")throw new Error("onesLike is not supported for string tensors");if(o.dtype==="complex64"){let n=Qe({inputs:{input:o},backend:e}),s=QT({inputs:{x:n},backend:e}),a=$r({inputs:{input:o},backend:e}),i=bc({inputs:{x:a},backend:e}),c=ee({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),c}else return yc({backend:e,attrs:{shape:o.shape,value:1,dtype:o.dtype}})}var JT={kernelName:aa,backendName:"cpu",kernelFunc:QT};function Gd(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o;if(t.length===1)return di({inputs:{input:t[0]},backend:e,attrs:{dim:n}});let s=t[0].shape,a=t[0].dtype;t.forEach(l=>{y.assertShapesMatch(s,l.shape,"All tensors passed to stack must have matching shapes"),y.assert(a===l.dtype,()=>"All tensors passed to stack must have matching dtypes")});let i=[],c=t.map(l=>{let u=di({inputs:{input:l},backend:e,attrs:{dim:n}});return i.push(u),u}),p=To({inputs:c,backend:e,attrs:{axis:n}});return i.forEach(l=>e.disposeIntermediateTensorInfo(l)),p}var tS={kernelName:ca,backendName:"cpu",kernelFunc:Gd};function WP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{paddings:s,constantValue:a}=o;W(n,"pad");let i=s.map((b,S)=>b[0]+n.shape[S]+b[1]),c=s.map(b=>b[0]),p=e.data.get(n.dataId).values,l=y.sizeFromShape(n.shape),u=n.shape.length,m=y.computeStrides(n.shape),f=y.sizeFromShape(i),d=i.length,h=y.computeStrides(i),g=y.getTypedArrayFromDType(n.dtype,f);a!==0&&g.fill(a);for(let b=0;b<l;b++){let N=y.indexToLoc(b,u,m).map(($,R)=>$+c[R]),k=y.locToIndex(N,d,h);g[k]=p[b]}return{dataId:e.write(g,i,n.dtype),shape:i,dtype:n.dtype}}var Ll={kernelName:pa,backendName:"cpu",kernelFunc:WP};var GP=gt((r,t)=>Math.pow(r,t)),UP=Ct("Pow",GP),eS={kernelName:"Pow",backendName:"cpu",kernelFunc:UP};function HP(r){let{inputs:t,backend:e,attrs:o}=r,{paramsNestedSplits:n,paramsDenseValues:s,indices:a}=t,{outputRaggedRank:i}=o,c=n.map(x=>e.data.get(x.dataId).values),p=n.map(x=>x.shape),l=e.data.get(s.dataId).values,u=e.data.get(a.dataId).values,[m,f,d]=Sl(c,p,l,s.shape,s.dtype,u,a.shape,i),h=m.map(x=>e.makeTensorInfo([x.length],"int32",x)),g=e.makeTensorInfo(d,s.dtype,f);return h.concat([g])}var rS={kernelName:ma,backendName:"cpu",kernelFunc:HP};function KP(r){let{inputs:t,backend:e,attrs:o}=r,{shape:n,values:s,defaultValue:a,rowPartitionTensors:i}=t,{rowPartitionTypes:c}=o,p=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,u=e.data.get(a.dataId).values,m=i.map(g=>e.data.get(g.dataId).values),f=i.map(g=>g.shape),[d,h]=wl(p,n.shape,l,s.shape,s.dtype,u,a.shape,m,f,c);return e.makeTensorInfo(d,s.dtype,h)}var oS={kernelName:fa,backendName:"cpu",kernelFunc:KP};function qP(r){let{backend:t,attrs:e}=r,{start:o,stop:n,dtype:s,step:a}=e,i=Nl(o,n,a,s);return t.makeTensorInfo([i.length],s,i)}var nS={kernelName:da,backendName:"cpu",kernelFunc:qP};var XP=it(cn,r=>1/r),sS={kernelName:cn,backendName:"cpu",kernelFunc:XP};function jP(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o;W(n,"resizeBilinear");let c=y.computeStrides(n.shape),[p,l]=i,[u,m,f,d]=n.shape,h=e.data.get(n.dataId).values,g=new Float32Array(y.sizeFromShape([u,p,l,d])),x=[s&&p>1?m-1:m,s&&l>1?f-1:f],b=[s&&p>1?p-1:p,s&&l>1?l-1:l],S=0,N=x[0]/b[0],k=x[1]/b[1];for(let $=0;$<u;$++)for(let R=0;R<p;R++){let A;a?A=N*(R+.5)-.5:A=N*R;let D=Math.max(0,Math.floor(A)),_=A-D,O=Math.min(m-1,Math.ceil(A)),L=$*c[0]+D*c[1],B=$*c[0]+O*c[1];for(let M=0;M<l;M++){let V;a?V=k*(M+.5)-.5:V=k*M;let G=Math.max(0,Math.floor(V)),U=V-G,z=Math.min(f-1,Math.ceil(V)),H=L+G*c[2],q=B+G*c[2],X=L+z*c[2],Z=B+z*c[2];for(let j=0;j<d;j++){let J=h[H+j],Y=h[q+j],et=h[X+j],nt=h[Z+j],ct=J+(et-J)*U,pt=Y+(nt-Y)*U,ht=ct+(pt-ct)*_;g[S++]=ht}}}return e.makeTensorInfo([u,p,l,d],"float32",g)}var aS={kernelName:ya,backendName:"cpu",kernelFunc:jP};function YP(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o;W([s,n],"resizeBilinearGrad");let i=y.computeStrides(n.shape),[c,p,l,u]=n.shape,[,m,f]=s.shape,d=new Float32Array(c*p*l*u),h=[a&&m>1?p-1:p,a&&f>1?l-1:l],g=[a&&m>1?m-1:m,a&&f>1?f-1:f],x=h[0]/g[0],b=h[1]/g[1],S=e.data.get(s.dataId).values,N=0;for(let k=0;k<c;k++){let $=k*i[0];for(let R=0;R<m;R++){let A=R*x,D=Math.floor(A),_=Math.min(Math.ceil(A),p-1),O=$+D*i[1],L=$+_*i[1],B=A-D,M=1-B;for(let V=0;V<f;V++){let G=V*b,U=Math.floor(G),z=Math.min(Math.ceil(G),l-1),H=G-U,q=1-H,X=O+U*i[2],Z=O+z*i[2],j=L+U*i[2],J=L+z*i[2],Y=M*q,et=M*H,nt=B*q,ct=B*H;for(let pt=0;pt<u;pt++){let ht=S[N++];d[X+pt]+=ht*Y,d[Z+pt]+=ht*et,d[j+pt]+=ht*nt,d[J+pt]+=ht*ct}}}}return e.makeTensorInfo([c,l,p,u],"float32",d)}var iS={kernelName:jc,backendName:"cpu",kernelFunc:YP};function ZP(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o;W(n,"resizeNearestNeighbor");let c=y.computeStrides(n.shape),[p,l]=i,[u,m,f,d]=n.shape,h=e.data.get(n.dataId).values,g=new Float32Array(u*p*l*d),x=[s&&p>1?m-1:m,s&&l>1?f-1:f],b=[s&&p>1?p-1:p,s&&l>1?l-1:l],S=x[0]/b[0],N=x[1]/b[1],k=0;for(let $=0;$<u;$++){let R=$*c[0];for(let A=0;A<p;A++){let D=a?S*(A+.5):S*A,_=Math.min(m-1,s?Math.round(D):Math.floor(D));a&&(_=Math.max(0,_));let O=R+_*c[1];for(let L=0;L<l;L++){let B=a?N*(L+.5):N*L,M=Math.min(f-1,s?Math.round(B):Math.floor(B));a&&(M=Math.max(0,M));let V=O+M*c[2];for(let G=0;G<d;G++){let U=h[V+G];g[k++]=U}}}}return e.makeTensorInfo([u,p,l,d],n.dtype,g)}var cS={kernelName:xa,backendName:"cpu",kernelFunc:ZP};function QP(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o;W([s,n],"resizeNearestNeighborGrad");let i=y.computeStrides(n.shape),c=y.computeStrides(s.shape),[p,l,u,m]=n.shape,[,f,d]=s.shape,h=new Float32Array(p*l*u*m),g=e.data.get(s.dataId).values,x=[a&&f>1?l-1:l,a&&d>1?u-1:u],b=[a&&f>1?f-1:f,a&&d>1?d-1:d],S=x[0]/b[0],N=x[1]/b[1],k=1/S,$=1/N,R=Math.ceil(k)*2+2,A=Math.ceil($)*2+2;for(let D=0;D<p;D++){let _=D*i[0];for(let O=0;O<l;O++){let L=_+O*i[1],B=Math.floor(O*k),M=Math.floor(B-R/2);for(let V=0;V<u;V++){let G=L+V*i[2],U=Math.floor(V*$),z=Math.floor(U-A/2);for(let H=0;H<m;H++){let q=0;for(let X=0;X<R;X++){let Z=X+M;if(Z<0||Z>=f)continue;let j=_+Z*c[1],J=Z*S,Y=Math.min(l-1,a?Math.round(J):Math.floor(J));if(O===Y)for(let et=0;et<A;et++){let nt=et+z;if(nt<0||nt>=d)continue;let ct=j+nt*c[2],pt=nt*N,ht=Math.min(u-1,a?Math.round(pt):Math.floor(pt));V===ht&&(q+=g[ct+H])}}h[G+H]=q}}}}return e.makeTensorInfo(n.shape,n.dtype,h)}var pS={kernelName:Xc,backendName:"cpu",kernelFunc:QP};function JP(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dims:s}=o;W(n,"reverse");let a=n.shape.length,i=y.parseAxisParam(s,n.shape);if(a===0)return le({inputs:{x:n},backend:e});let c=new vt(n.shape,n.dtype),p=e.bufferSync(n);for(let l=0;l<c.size;l++){let u=c.indexToLoc(l),m=u.slice();i.forEach(f=>m[f]=n.shape[f]-1-m[f]),c.set(p.get(...m),...u)}return e.makeTensorInfo(c.shape,c.dtype,c.values)}var lS={kernelName:ba,backendName:"cpu",kernelFunc:JP};var uS={kernelName:Wa,backendName:"cpu",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{image:o}=r,{radians:n,fillValue:s,center:a}=t,i=e,c=y.getTypedArrayFromDType(o.dtype,y.sizeFromShape(o.shape)),[p,l,u,m]=o.shape,[f,d]=I.getImageCenter(a,l,u),h=255,g=Math.sin(n),x=Math.cos(n),b=i.data.get(o.dataId).values;for(let N=0;N<p;N++){let k=N*u*l*m;for(let $=0;$<l;$++){let R=$*(u*m);for(let A=0;A<u;A++){let D=A*m;for(let _=0;_<m;_++){let O=[p,$,A,_],L=O[2],B=O[1],M=(L-f)*x-(B-d)*g,V=(L-f)*g+(B-d)*x;M=Math.round(M+f),V=Math.round(V+d);let G=s;if(typeof s!="number"&&(_===3?G=h:G=s[_]),M>=0&&M<u&&V>=0&&V<l){let z=V*(u*m),H=M*m,q=k+z+H+_;G=b[q]}let U=k+R+D+_;c[U]=G}}}}return{dataId:i.write(c,o.shape,o.dtype),shape:o.shape,dtype:o.dtype}}};var tL=it(un,r=>{let t=Math.floor(r);return r-t<.5?Math.floor(r):r-t>.5?Math.ceil(r):t%2===0?t:t+1}),mS={kernelName:un,backendName:"cpu",kernelFunc:tL};function eL(r){let{inputs:t,backend:e,attrs:o}=r,{indices:n,updates:s}=t,{shape:a}=o,{sliceRank:i,numUpdates:c,sliceSize:p,strides:l,outputSize:u}=I.calculateShapes(s,n,a),m=!0,f=e.bufferSync(n),d=e.bufferSync(s),h=Ur(f,d,a,u,p,c,i,l,0,m);return e.makeTensorInfo(a,h.dtype,h.values)}var fS={kernelName:Ca,backendName:"cpu",kernelFunc:eL};function rL(r,t){let e=0,o=r.length,n=0;for(;e<o;)n=Math.floor((e+o)/2),r[n]<t?e=n+1:o=n;return o}function oL(r,t){let e=0,o=r.length,n=0;for(;e<o;)n=Math.floor((e+o)/2),r[n]<=t?e=n+1:o=n;return o}function dS(r,t,e,o,n,s){let a=y.getArrayFromDType("int32",e*n);for(let i=0;i<e;++i){let c=r.slice(i*o,(i+1)*o),p=i*n;for(let l=0;l<n;++l)a[p+l]=s==="left"?rL(c,t[l+p]):oL(c,t[l+p])}return a}function nL(r){let{inputs:t,backend:e,attrs:o}=r,{sortedSequence:n,values:s}=t,{side:a}=o,i=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,p=dS(i,c,n.shape[0],n.shape[1],s.shape[1],a);return e.makeTensorInfo(s.shape,"int32",p)}var hS={kernelName:Ta,backendName:"cpu",kernelFunc:nL};function sL(r){let{inputs:t,backend:e}=r,{condition:o,t:n,e:s}=t;W([o,n,s],"select");let a=o.shape.length,i=e.data.get(o.dataId).values,c=e.data.get(n.dataId).values,p=e.data.get(s.dataId).values,l=Yt(n.dtype,s.dtype),u=y.makeZerosTypedArray(y.sizeFromShape(n.shape),l),m=0,f=a===0||a>1||n.shape.length===1?1:y.sizeFromShape(n.shape.slice(1));for(let d=0;d<i.length;d++)for(let h=0;h<f;h++)i[d]===1?u[m++]=c[d]:u[m++]=p[d];return e.makeTensorInfo(n.shape,l,u)}var gS={kernelName:Sa,backendName:"cpu",kernelFunc:sL};var aL=I.SELU_SCALEALPHA,iL=I.SELU_SCALE,cL=it(fn,r=>r>=0?iL*r:aL*(Math.exp(r)-1)),xS={kernelName:fn,backendName:"cpu",kernelFunc:cL};var pL=it(hn,r=>r<0?-1:r>0?1:0),yS={kernelName:hn,backendName:"cpu",kernelFunc:pL};var lL=it("Sin",r=>Math.sin(r)),bS={kernelName:"Sin",backendName:"cpu",kernelFunc:lL};var uL=it(dn,r=>Math.sinh(r)),CS={kernelName:dn,backendName:"cpu",kernelFunc:uL};var mL=11920928955078125e-23,TS=Math.log(mL)+2,fL=it(xn,r=>{let t=r>-TS,e=r<TS,o=Math.exp(r),n;return e?n=o:t?n=r:n=Math.log(1+o),n}),SS={kernelName:xn,backendName:"cpu",kernelFunc:fL};function dL(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,paddings:a}=o;W([n],"spaceToBatchND");let i=y.sizeFromShape(s),c=[[0,0]];c.push(...a);for(let $=1+s.length;$<n.shape.length;++$)c.push([0,0]);let p=Ll.kernelFunc({inputs:{x:n},backend:e,attrs:{paddings:c,constantValue:0}}),l=I.getReshaped(p.shape,s,i,!1),u=I.getPermuted(l.length,s.length,!1),m=I.getReshapedPermuted(p.shape,s,i,!1),h=dt({inputs:{x:p},backend:e,attrs:{shape:l}}),b=Bt({inputs:{x:h},backend:e,attrs:{perm:u}}),k=dt({inputs:{x:b},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(h),e.disposeIntermediateTensorInfo(b),k}var wS={kernelName:Na,backendName:"cpu",kernelFunc:dL};function hL(r){let{inputs:t,backend:e}=r,{indices:o,values:n,denseShape:s,defaultValue:a}=t;if(s.shape.length!==1)throw new Error(`Dense shape must be a vector, saw:
        ${s.shape}`);if(o.shape.length!==2)throw new Error(`Indices must be a matrix, saw:
        ${o.shape}`);if(n.shape.length!==1)throw new Error(`Values must be a vector, saw:
        ${n.shape}`);if(a.shape.length!==0)throw new Error(`Default value must be a scalar, saw:
        ${a.shape}`);let i=e.data.get(o.dataId).values,c=e.data.get(n.dataId).values,p=e.data.get(s.dataId).values,l=e.data.get(a.dataId).values[0],[u,m,f,d,h]=Il(i,o.shape,o.dtype,c,n.dtype,p,l);return[e.makeTensorInfo(m,o.dtype,u),e.makeTensorInfo([m[0]],n.dtype,f),e.makeTensorInfo([d.length],"bool",new Uint8Array(d.map(g=>Number(g)))),e.makeTensorInfo([h.length],o.dtype,new Int32Array(h))]}var NS={kernelName:ka,backendName:"cpu",kernelFunc:hL};function gL(r){let{inputs:t,backend:e}=r,{inputIndices:o,inputShape:n,newShape:s}=t;if(o.shape.length!==2)throw new Error(`Input indices should be a matrix but received shape
        ${o.shape}`);if(n.shape.length!==1)throw new Error(`Input shape should be a vector but received shape
        ${n.shape}`);if(s.shape.length!==1)throw new Error(`Target shape should be a vector but received shape ${s.shape}`);let a=Array.from(e.data.get(n.dataId).values),i=e.data.get(o.dataId).values,c=Array.from(e.data.get(s.dataId).values),[p,l,u]=vl(i,o.shape,o.dtype,a,c);return[e.makeTensorInfo(l,o.dtype,p),e.makeTensorInfo([u.length],s.dtype,new Int32Array(u))]}var IS={kernelName:Ea,backendName:"cpu",kernelFunc:gL};function xL(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
          ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
          ${s.shape}`);if(n.shape[0]!==s.shape[0])throw new Error("segmentIds and indices should have same size.");let a=e.data.get(o.dataId).values,i=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,[p,l]=mi(a,o.shape,o.dtype,i,c,!0);return e.makeTensorInfo(l,o.dtype,p)}var vS={kernelName:$a,backendName:"cpu",kernelFunc:xL};function yL(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
         ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
         ${s.shape}`);if(n.shape[0]!==s.shape[0])throw new Error("segmentIds and indices should have same size.");let a=e.data.get(o.dataId).values,i=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,[p,l]=mi(a,o.shape,o.dtype,i,c);return e.makeTensorInfo(l,o.dtype,p)}var kS={kernelName:Ra,backendName:"cpu",kernelFunc:yL};function bL(r){let{inputs:t,backend:e,attrs:o}=r,{sparseIndices:n,sparseValues:s,defaultValue:a}=t,{outputShape:i}=o,{sliceRank:c,numUpdates:p,sliceSize:l,strides:u,outputSize:m}=I.calculateShapes(s,n,i),f=!1,d=e.bufferSync(n),h;switch(s.dtype){case"bool":{let g=e.bufferSync(s),x=!!e.data.get(a.dataId).values[0];h=Ur(d,g,i,m,l,p,c,u,x,f);break}case"float32":{let g=e.bufferSync(s),x=e.data.get(a.dataId).values[0];h=Ur(d,g,i,m,l,p,c,u,x,f);break}case"int32":{let g=e.bufferSync(s),x=e.data.get(a.dataId).values[0];h=Ur(d,g,i,m,l,p,c,u,x,f);break}case"string":{let g=e.bufferSync(s),x=y.decodeString(e.data.get(a.dataId).values[0]);h=Ur(d,g,i,m,l,p,c,u,x,f);break}default:throw new Error(`Unsupported type ${s.dtype}`)}return e.makeTensorInfo(i,h.dtype,h.values)}var ES={kernelName:Aa,backendName:"cpu",kernelFunc:bL};function CL(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{numOrSizeSplits:s,axis:a}=o,i=y.parseAxisParam(a,n.shape)[0],c=I.prepareSplitSize(n,s,i),p=new Array(n.shape.length).fill(0),l=n.shape.slice();return c.map(u=>{let m=[...l];m[i]=u;let f=rr({inputs:{x:n},backend:e,attrs:{begin:p,size:m}});return p[i]+=u,f})}var $S={kernelName:Ia,backendName:"cpu",kernelFunc:CL};var RS={kernelName:Yc,backendName:"cpu",kernelFunc:({inputs:r,backend:t})=>{let{x:e}=r,o=t;W(e,"square");let n=o.data.get(e.dataId).values,s=new Float32Array(n.length);for(let i=0;i<n.length;++i){let c=n[i];s[i]=c*c}return{dataId:o.write(s,e.shape,e.dtype),shape:e.shape,dtype:e.dtype}}};var TL=it(Tn,(r,t)=>{let e=t;return isNaN(r)?NaN:r>0?1:e.alpha}),AS={kernelName:Tn,backendName:"cpu",kernelFunc:TL};function SL(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,end:a,strides:i,beginMask:c,endMask:p,ellipsisMask:l,newAxisMask:u,shrinkAxisMask:m}=o;W(n,"stridedSlice");let{finalShapeSparse:f,finalShape:d,isIdentity:h,sliceDim0:g,isSimpleSlice:x,begin:b,end:S,strides:N}=ne.sliceInfo(n.shape,s,a,i,c,p,l,u,m),k;if(h)k=dt({inputs:{x:n},backend:e,attrs:{shape:d}});else if(g||x){y.assert(n.shape.length>=1,()=>`Input must have rank at least 1, got: ${n.shape.length}`);let $=ne.computeOutShape(b,S,N),R=rr({inputs:{x:n},backend:e,attrs:{begin:b,size:$}});k=dt({inputs:{x:R},backend:e,attrs:{shape:d}}),e.disposeIntermediateTensorInfo(R)}else{let $=e.bufferSync(n),R=kl(f,$,N,b);k=e.makeTensorInfo(d,R.dtype,R.values)}return k}var FS={kernelName:Fa,backendName:"cpu",kernelFunc:SL};function wL(r){let{inputs:t,backend:e,attrs:o}=r,{separator:n,nGramWidths:s,leftPad:a,rightPad:i,padWidth:c,preserveShortSequences:p}=o,{data:l,dataSplits:u}=t,m=e.data.get(l.dataId).values,f=e.data.get(u.dataId).values,[d,h]=El(m,f,n,s,a,i,c,p);return[e.makeTensorInfo([d.length],"string",d),e.makeTensorInfo(u.shape,"int32",h)]}var DS={kernelName:Da,backendName:"cpu",kernelFunc:wL};function NL(r){let{inputs:t,backend:e,attrs:o}=r,{skipEmpty:n}=o,{input:s,delimiter:a}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(s.shape.length!==1)throw new Error(`Input must be a vector, got shape: ${s.shape}`);if(a.shape.length!==0)throw new Error(`Delimiter must be a scalar, got shape: ${a.shape}`);let i=e.data.get(s.dataId).values,c=e.data.get(a.dataId).values[0],[p,l,u]=$l(i,c,n),m=l.length;return[e.makeTensorInfo([m,2],"int32",p),e.makeTensorInfo([m],"string",l),e.makeTensorInfo([2],"int32",new Int32Array(u))]}var _S={kernelName:_a,backendName:"cpu",kernelFunc:NL};function IL(r){let{inputs:t,backend:e,attrs:o}=r,{numBuckets:n}=o,{input:s}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(n<=0)throw new Error("Number of buckets must be at least 1");let a=e.data.get(s.dataId).values,i=Rl(a,n);return e.makeTensorInfo(s.shape,"int32",i)}var OS={kernelName:Oa,backendName:"cpu",kernelFunc:IL};var vL=it("Tan",r=>Math.tan(r)),PS={kernelName:"Tan",backendName:"cpu",kernelFunc:vL};var kL=it(Cn,r=>Math.tanh(r)),LS={kernelName:Cn,backendName:"cpu",kernelFunc:kL};function EL(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reps:s}=o;W(n,"tile");let a=Al(e.bufferSync(n),s);return e.makeTensorInfo(a.shape,a.dtype,a.values)}var BS={kernelName:no,backendName:"cpu",kernelFunc:EL};function $L(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{k:s,sorted:a}=o;W(n,"topk");let i=e.data.get(n.dataId).values,[c,p]=Fl(i,n.shape,n.dtype,s,a);return[e.makeTensorInfo(c.shape,c.dtype,c.values),e.makeTensorInfo(p.shape,p.dtype,p.values)]}var VS={kernelName:Pa,backendName:"cpu",kernelFunc:$L};function RL(r){let{inputs:t,attrs:e,backend:o}=r,{image:n,transforms:s}=t,{interpolation:a,fillMode:i,fillValue:c,outputShape:p}=e,[l,u,m,f]=n.shape,[d,h]=p??[u,m],g=[l,d,h,f],x=y.computeStrides(n.shape),b=x[0],S=x[1],N=x[2],k=y.computeStrides(g),$=k[0],R=k[1],A=k[2],D=y.getTypedArrayFromDType(n.dtype,y.sizeFromShape(g));D.fill(c);let _=o.data.get(n.dataId).values,O=o.data.get(s.dataId).values;for(let B=0;B<l;++B){let M=s.shape[0]===1?O:O.subarray(B*8,B*8+8);for(let V=0;V<d;++V)for(let G=0;G<h;++G)for(let U=0;U<f;++U){let z,H=M[6]*G+M[7]*V+1;if(H===0)continue;let q=(M[0]*G+M[1]*V+M[2])/H,X=(M[3]*G+M[4]*V+M[5])/H,Z=MS(q,m,i),j=MS(X,u,i);switch(a){case"nearest":z=OL(_,u,m,b,S,N,B,j,Z,U,c);break;case"bilinear":z=PL(_,u,m,b,S,N,B,j,Z,U,c);break;default:throw new Error(`Error in Transform: Expect 'nearest' or 'bilinear', but got ${a}`)}let J=B*$+V*R+G*A+U;D[J]=z}return o.makeTensorInfo(g,n.dtype,D)}return{dataId:o.write(D,g,n.dtype),shape:n.shape,dtype:n.dtype}}var zS={kernelName:La,backendName:"cpu",kernelFunc:RL};function MS(r,t,e){switch(e){case"reflect":return AL(r,t);case"wrap":return FL(r,t);case"nearest":return _L(r,t);default:return DL(r,t)}}function AL(r,t){let e=r;if(e<0)if(t<=1)e=0;else{let o=2*t;e<o&&(e=o*Math.trunc(-e/o)+e),e=e<-t?e+o:-e-1}else if(e>t-1)if(t<=1)e=0;else{let o=2*t;e-=o*Math.trunc(e/o),e>=t&&(e=o-e-1)}return y.clamp(0,e,t-1)}function FL(r,t){let e=r;if(e<0)if(t<=1)e=0;else{let o=t-1;e+=t*(Math.trunc(-e/o)+1)}else if(e>t-1)if(t<=1)e=0;else{let o=t-1;e-=t*Math.trunc(e/o)}return y.clamp(0,e,t-1)}function DL(r,t){return r}function _L(r,t){return y.clamp(0,r,t-1)}function Cc(r,t,e,o,n,s,a,i,c,p,l){let u=a*o+i*n+c*s+p;return 0<=i&&i<t&&0<=c&&c<e?r[u]:l}function OL(r,t,e,o,n,s,a,i,c,p,l){let u=Math.round(i),m=Math.round(c);return Cc(r,t,e,o,n,s,a,u,m,p,l)}function PL(r,t,e,o,n,s,a,i,c,p,l){let u=Math.floor(i),m=Math.floor(c),f=u+1,d=m+1,h=(d-c)*Cc(r,t,e,o,n,s,a,u,m,p,l)+(c-m)*Cc(r,t,e,o,n,s,a,u,d,p,l),g=(d-c)*Cc(r,t,e,o,n,s,a,f,m,p,l)+(c-m)*Cc(r,t,e,o,n,s,a,f,d,p,l);return(f-i)*h+(i-u)*g}function LL(r){let{inputs:t,attrs:e,backend:o}=r,{axis:n}=e,{x:s}=t;W(s,"unique");let a=o.data.get(s.dataId).values,{outputValues:i,outputShape:c,indices:p}=Dl(a,n,s.shape,s.dtype);return[o.makeTensorInfo(c,s.dtype,i),o.makeTensorInfo([p.length],"int32",p)]}var WS={kernelName:Ba,backendName:"cpu",kernelFunc:LL};function BL(r){let{inputs:t,backend:e,attrs:o}=r,{value:n}=t,{axis:s}=o;s<0&&(s+=n.shape.length);let a=n.shape.length,i=n.shape[s],c=new Array(a-1),p=0;for(let f=0;f<a;f++)f!==s&&(c[p++]=n.shape[f]);let l=new Array(a).fill(0),u=n.shape.slice();u[s]=1;let m=new Array(i);for(let f=0;f<m.length;f++){l[s]=f;let d=rr({inputs:{x:n},backend:e,attrs:{begin:l,size:u}});m[f]=dt({inputs:{x:d},backend:e,attrs:{shape:c}}),e.disposeIntermediateTensorInfo(d)}return m}var GS={kernelName:Va,backendName:"cpu",kernelFunc:BL};function VL(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,segmentIds:s}=t,{numSegments:a}=o;W(n,"unsortedSegmentSum");let i=n.shape.length,c=s.shape.length,p=[],l=[],u=i-c,m=s;for(let d=0;d<u;++d){let h=di({inputs:{input:m},backend:e,attrs:{dim:d+1}});m=h,l.push(h)}for(let d=0;d<a;++d){let h=y.createScalarValue(d,"int32"),g=e.makeTensorInfo([],"int32",h),x=pd({inputs:{a:g,b:m},backend:e}),b=Je({inputs:{x},backend:e,attrs:{dtype:"float32"}}),S=Xn({inputs:{a:b,b:n},backend:e}),N=Hr({inputs:{x:S},backend:e,attrs:{axis:0,keepDims:!1}});p.push(N),l.push(g),l.push(x),l.push(b),l.push(S),l.push(N)}let f=Gd({inputs:p,backend:e,attrs:{axis:0}});return l.forEach(d=>e.disposeIntermediateTensorInfo(d)),f}var US={kernelName:Ma,backendName:"cpu",kernelFunc:VL};var ML=[xC,$0,yC,bC,_0,CC,TC,SC,wC,NC,IC,vC,kC,EC,$C,AC,FC,DC,_C,gC,OC,PC,LC,BC,D0,O0,VC,R0,MC,WC,GC,UC,HC,KC,qC,XC,jC,YC,ZC,QC,JC,tT,eT,rT,oT,nT,sT,aT,iT,cT,lT,lC,uT,P0,mT,L0,fT,B0,dT,hT,gT,V0,xT,yT,bT,CT,TT,M0,z0,A0,ST,zC,wT,NT,IT,uC,W0,G0,vT,U0,kT,ET,$T,RT,AT,FT,DT,H0,_T,OT,PT,LT,VT,MT,zT,K0,WT,GT,KT,q0,X0,qT,XT,jT,j0,YT,JT,tS,Ll,eS,mC,Z0,rS,oS,nS,F0,xc,sS,fC,dC,hC,aS,iS,cS,pS,lS,uS,mS,eC,fS,hS,gS,xS,oC,yS,bS,CS,nC,UT,SS,wS,NS,IS,vS,kS,ES,$S,aC,RS,iC,AS,FS,DS,_S,OS,cC,pT,PS,LS,BS,VS,zS,Y0,WS,GS,US,ZT];for(let r of ML)Qc(r);var Yn={},Bl={alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,depth:!1,stencil:!1,failIfMajorPerformanceCaveat:!0};function HS(r,t){Yn[r]=t}function Fe(r,t){if(!(r in Yn)||t!=null){let o=WL(r,t);if(o!==null)Yn[r]=o;else return console.log("Could not get context for WebGL version",r),null}let e=Yn[r];return e==null||e.isContextLost()?(delete Yn[r],Fe(r)):(e.disable(e.DEPTH_TEST),e.disable(e.STENCIL_TEST),e.disable(e.BLEND),e.disable(e.DITHER),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SAMPLE_COVERAGE),e.enable(e.SCISSOR_TEST),e.enable(e.CULL_FACE),e.cullFace(e.BACK),Yn[r])}function zL(r){if(typeof OffscreenCanvas<"u"&&r===2)return new OffscreenCanvas(300,150);if(typeof document<"u")return document.createElement("canvas");throw new Error("Cannot create a canvas in this context")}function WL(r,t){if(r!==1&&r!==2)throw new Error("Cannot get WebGL rendering context, WebGL is disabled.");let e=t??zL(r);return e.addEventListener("webglcontextlost",o=>{o.preventDefault(),delete Yn[r]},!1),F().getBool("SOFTWARE_WEBGL_ENABLED")&&(Bl.failIfMajorPerformanceCaveat=!1),r===1?e.getContext("webgl",Bl)||e.getContext("experimental-webgl",Bl):e.getContext("webgl2",Bl)}var So;(function(r){r[r.DENSE=0]="DENSE",r[r.SHARED_BATCH=1]="SHARED_BATCH"})(So||(So={}));var ue;(function(r){r[r.RENDER=0]="RENDER",r[r.UPLOAD=1]="UPLOAD",r[r.PIXELS=2]="PIXELS",r[r.DOWNLOAD=3]="DOWNLOAD"})(ue||(ue={}));var ae;(function(r){r[r.UNPACKED_FLOAT16=0]="UNPACKED_FLOAT16",r[r.UNPACKED_FLOAT32=1]="UNPACKED_FLOAT32",r[r.PACKED_4X1_UNSIGNED_BYTE=2]="PACKED_4X1_UNSIGNED_BYTE",r[r.PACKED_2X2_FLOAT32=3]="PACKED_2X2_FLOAT32",r[r.PACKED_2X2_FLOAT16=4]="PACKED_2X2_FLOAT16"})(ae||(ae={}));function Zn(r,t){return[t,r]}function KS(r,t){return r*t}function Tc(r){let t=y.sizeFromShape(r),e=Math.ceil(t/4);return y.sizeToSquarishShape(e)}function Rr(r,t){return[Math.max(1,Math.ceil(t/2)),Math.max(1,Math.ceil(r/2))]}function qS(r,t){let[e,o]=Rr(r,t);return e*o*4}function Sc(r,t){let e=r,o,n,s,a,i,c,p,l,u,m;return F().getNumber("WEBGL_VERSION")===2?(o=e.R32F,n=e.R16F,s=e.RGBA16F,a=e.RGBA32F,i=e.RED,p=4,l=1,u=e.HALF_FLOAT,m=e.FLOAT,c=e.RGBA8):(o=r.RGBA,n=r.RGBA,s=r.RGBA,a=e.RGBA,i=r.RGBA,p=4,l=4,u=t!=null?t.HALF_FLOAT_OES:null,m=r.FLOAT,c=r.RGBA),{internalFormatFloat:o,internalFormatHalfFloat:n,internalFormatPackedHalfFloat:s,internalFormatPackedFloat:a,textureFormatFloat:i,downloadTextureFormat:c,downloadUnpackNumChannels:p,defaultNumChannels:l,textureTypeHalfFloat:u,textureTypeFloat:m}}function ot(r,t){let e=t();return F().getBool("DEBUG")&&GL(r),e}function GL(r){let t=r.getError();if(t!==r.NO_ERROR)throw new Error("WebGL Error: "+KL(r,t))}var UL=596e-10,HL=65504;function XS(r){return!!(F().getBool("WEBGL_RENDER_FLOAT32_ENABLED")||r===0||UL<Math.abs(r)&&Math.abs(r)<HL)}function KL(r,t){switch(t){case r.NO_ERROR:return"NO_ERROR";case r.INVALID_ENUM:return"INVALID_ENUM";case r.INVALID_VALUE:return"INVALID_VALUE";case r.INVALID_OPERATION:return"INVALID_OPERATION";case r.INVALID_FRAMEBUFFER_OPERATION:return"INVALID_FRAMEBUFFER_OPERATION";case r.OUT_OF_MEMORY:return"OUT_OF_MEMORY";case r.CONTEXT_LOST_WEBGL:return"CONTEXT_LOST_WEBGL";default:return`Unknown error code ${t}`}}function wc(r,t){return Kr(r,()=>r.getExtension(t),'Extension "'+t+'" not supported on this browser.')}function jS(r,t){let e=Kr(r,()=>r.createShader(r.VERTEX_SHADER),"Unable to create vertex WebGLShader.");if(ot(r,()=>r.shaderSource(e,t)),ot(r,()=>r.compileShader(e)),r.getShaderParameter(e,r.COMPILE_STATUS)===!1)throw console.log(r.getShaderInfoLog(e)),new Error("Failed to compile vertex shader.");return e}function YS(r,t){let e=Kr(r,()=>r.createShader(r.FRAGMENT_SHADER),"Unable to create fragment WebGLShader.");if(ot(r,()=>r.shaderSource(e,t)),ot(r,()=>r.compileShader(e)),F().get("ENGINE_COMPILE_ONLY"))return e;if(r.getShaderParameter(e,r.COMPILE_STATUS)===!1)throw Xd(t,r.getShaderInfoLog(e)),new Error("Failed to compile fragment shader.");return e}var qL=/ERROR: [0-9]+:([0-9]+):/g;function Xd(r,t){let e=qL.exec(t);if(e==null){console.log(`Couldn't parse line number in error: ${t}`),console.log(r);return}let o=+e[1],n=r.split(`
`),s=n.length.toString().length+2,a=n.map((u,m)=>y.rightPad((m+1).toString(),s)+u),i=0;for(let u=0;u<a.length;u++)i=Math.max(a[u].length,i);let c=a.slice(0,o-1),p=a.slice(o-1,o),l=a.slice(o);console.log(c.join(`
`)),console.log(t.split(`
`)[0]),console.log(`%c ${y.rightPad(p[0],i)}`,"border:1px solid red; background-color:#e3d2d2; color:#a61717"),console.log(l.join(`
`))}function ZS(r){return Kr(r,()=>r.createProgram(),"Unable to create WebGLProgram.")}function QS(r,t){if(ot(r,()=>r.linkProgram(t)),!F().get("ENGINE_COMPILE_ONLY")&&r.getProgramParameter(t,r.LINK_STATUS)===!1)throw console.log(r.getProgramInfoLog(t)),new Error("Failed to link vertex and fragment shaders.")}function Ml(r,t){if(ot(r,()=>r.validateProgram(t)),r.getProgramParameter(t,r.VALIDATE_STATUS)===!1)throw console.log(r.getProgramInfoLog(t)),new Error("Shader program validation failed.")}function JS(r,t){let e=Kr(r,()=>r.createBuffer(),"Unable to create WebGLBuffer");return ot(r,()=>r.bindBuffer(r.ARRAY_BUFFER,e)),ot(r,()=>r.bufferData(r.ARRAY_BUFFER,t,r.STATIC_DRAW)),e}function tw(r,t){let e=Kr(r,()=>r.createBuffer(),"Unable to create WebGLBuffer");return ot(r,()=>r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e)),ot(r,()=>r.bufferData(r.ELEMENT_ARRAY_BUFFER,t,r.STATIC_DRAW)),e}function ew(r){return Kr(r,()=>r.createTexture(),"Unable to create WebGLTexture.")}function rw(r,t){let e=F().getNumber("WEBGL_MAX_TEXTURE_SIZE");if(r<=0||t<=0){let o=`[${r}x${t}]`;throw new Error("Requested texture size "+o+" is invalid.")}if(r>e||t>e){let o=`[${r}x${t}]`,n=`[${e}x${e}]`;throw new Error("Requested texture size "+o+" greater than WebGL maximum on this browser / GPU "+n+".")}}function ow(r){return Kr(r,()=>r.createFramebuffer(),"Unable to create WebGLFramebuffer.")}function jd(r,t,e,o,n,s,a){let i=r.getAttribLocation(t,e);return i===-1?!1:(ot(r,()=>r.bindBuffer(r.ARRAY_BUFFER,o)),ot(r,()=>r.vertexAttribPointer(i,n,r.FLOAT,!1,s,a)),ot(r,()=>r.enableVertexAttribArray(i)),!0)}function XL(r,t,e){YL(r,e),ot(r,()=>r.activeTexture(r.TEXTURE0+e)),ot(r,()=>r.bindTexture(r.TEXTURE_2D,t))}function nw(r,t,e){return Kr(r,()=>r.getUniformLocation(t,e),'uniform "'+e+'" not present in program.')}function sw(r,t,e){return r.getUniformLocation(t,e)}function aw(r,t,e,o){ot(r,()=>XL(r,t,o)),ot(r,()=>r.uniform1i(e,o))}function zl(r,t,e){ot(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,e)),ot(r,()=>r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,t,0))}function Yd(r,t){ot(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,t)),ot(r,()=>r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,null,0))}function Nc(r){let t=r.checkFramebufferStatus(r.FRAMEBUFFER);if(t!==r.FRAMEBUFFER_COMPLETE)throw new Error("Error binding framebuffer: "+jL(r,t))}function jL(r,t){switch(t){case r.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:return"FRAMEBUFFER_INCOMPLETE_ATTACHMENT";case r.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:return"FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";case r.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:return"FRAMEBUFFER_INCOMPLETE_DIMENSIONS";case r.FRAMEBUFFER_UNSUPPORTED:return"FRAMEBUFFER_UNSUPPORTED";default:return`unknown error ${t}`}}function Kr(r,t,e){let o=ot(r,()=>t());if(o==null)throw new Error(e);return o}function YL(r,t){let e=r.MAX_COMBINED_TEXTURE_IMAGE_UNITS-1,o=t+r.TEXTURE0;if(o<r.TEXTURE0||o>e){let n=`[gl.TEXTURE0, gl.TEXTURE${e}]`;throw new Error(`textureUnit must be in ${n}.`)}}function wo(r,t=2){return y.sizeFromShape(r.slice(0,r.length-t))}function No(r){if(r.length===0)throw Error("Cannot get rows and columns of an empty shape array.");return[r.length>1?r[r.length-2]:1,r[r.length-1]]}function Wl(r){let t=[1,1,1];return r.length===0||r.length===1&&r[0]===1||(t=[wo(r),...No(r)]),t}function iw(r,t=!1){let e=F().getNumber("WEBGL_MAX_TEXTURE_SIZE"),o=F().getNumber("WEBGL_MAX_SIZE_FOR_NARROW_TEXTURE");o===1/0&&F().getBool("WEBGL_AUTO_SQUARIFY_NARROW_TEXTURE_SHAPE")&&(o=e/2),t&&(e=e*2,o=o*2,r=r.map((i,c)=>c>=r.length-2?y.nearestLargerEven(r[c]):r[c]),r.length===1&&(r=[2,r[0]])),r.length!==2&&(r=y.squeezeShape(r).newShape);let n=y.sizeFromShape(r),s=null;r.length<=1&&n<=e?s=[1,n]:r.length===2&&r[0]<=e&&r[1]<=e?s=r:r.length===3&&r[0]*r[1]<=e&&r[2]<=e?s=[r[0]*r[1],r[2]]:r.length===3&&r[0]<=e&&r[1]*r[2]<=e?s=[r[0],r[1]*r[2]]:r.length===4&&r[0]*r[1]*r[2]<=e&&r[3]<=e?s=[r[0]*r[1]*r[2],r[3]]:r.length===4&&r[0]<=e&&r[1]*r[2]*r[3]<=e&&(s=[r[0],r[1]*r[2]*r[3]]);let a=s!=null&&Math.max(...s)>o&&Math.min(...s)<=(t?2:1)&&Math.min(...s)>0;if(s==null||a)if(t){let i=wo(r),c=2,p=2;r.length&&([c,p]=No(r)),n=i*(c/2)*(p/2),s=y.sizeToSquarishShape(n).map(l=>l*2)}else s=y.sizeToSquarishShape(n);return s}function Vl(r){return r%2===0}function Qn(r,t){if(r=r.slice(-2),t=t.slice(-2),y.arraysEqual(r,t)||!r.length||!t.length||r[0]===0||r[1]===0||t[0]===0||t[1]===0)return!0;if(r.length!==t.length){let e=r.slice(-1)[0],o=t.slice(-1)[0];if(e===o||Vl(e)&&Vl(o)&&(r[0]===1||t[0]===1))return!0}return r[1]===t[1]&&Vl(r[0])&&Vl(t[0])}var Hd,Kd;function cw(r){if(Hd==null){let t=Fe(r);Hd=t.getParameter(t.MAX_TEXTURE_SIZE)}return Hd}function pw(r){if(Kd==null){let t=Fe(r);Kd=t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS)}return Math.min(16,Kd)}function lw(r){if(r===0)return 0;let t,e=Fe(r);return Me(e,"EXT_disjoint_timer_query_webgl2")&&r===2?t=2:Me(e,"EXT_disjoint_timer_query")?t=1:t=0,t}function Me(r,t){return r.getExtension(t)!=null}function Zd(r){try{if(Fe(r)!=null)return!0}catch(t){return console.log("Error when getting WebGL context: ",t),!1}return!1}function uw(r){if(r===0)return!1;let t=Fe(r);if(r===1){if(!Me(t,"OES_texture_float"))return!1}else if(!Me(t,"EXT_color_buffer_float"))return!1;return qd(t)}function mw(r){if(r===0)return!1;let t=Fe(r);if(r===1){if(!Me(t,"OES_texture_float")||!Me(t,"WEBGL_color_buffer_float"))return!1}else{if(Me(t,"EXT_color_buffer_float"))return qd(t);let o="EXT_color_buffer_half_float";if(Me(t,o)){let n=t.getExtension(o);return ZL(t,n)}return!1}return qd(t)}function qd(r){let t=Sc(r),e=r.createTexture();r.bindTexture(r.TEXTURE_2D,e),r.texImage2D(r.TEXTURE_2D,0,t.internalFormatFloat,1,1,0,t.textureFormatFloat,t.textureTypeFloat,null);let s=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,s),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,e,0);let a=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindTexture(r.TEXTURE_2D,null),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteTexture(e),r.deleteFramebuffer(s),a}function ZL(r,t){let e=Sc(r,t),o=r.createTexture();r.bindTexture(r.TEXTURE_2D,o),r.texImage2D(r.TEXTURE_2D,0,e.internalFormatHalfFloat,1,1,0,e.textureFormatFloat,e.textureTypeHalfFloat,null);let a=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,a),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,o,0);let i=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindTexture(r.TEXTURE_2D,null),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteTexture(o),r.deleteFramebuffer(a),i}function fw(r){return r!==2?!1:Fe(r).fenceSync!=null}function Ar(r,t){Array.isArray(r)||(r=[r]),r.forEach(e=>{e!=null&&y.assert(e.dtype!=="complex64",()=>`${t} does not support complex64 tensors in the WebGL backend.`)})}var st=F();st.registerFlag("HAS_WEBGL",()=>st.getNumber("WEBGL_VERSION")>0);st.registerFlag("WEBGL_VERSION",()=>Zd(2)?2:Zd(1)?1:0);st.registerFlag("WEBGL_CHECK_NUMERICAL_PROBLEMS",()=>!1);st.registerFlag("WEBGL_BUFFER_SUPPORTED",()=>st.get("WEBGL_VERSION")===2);st.registerFlag("WEBGL_CPU_FORWARD",()=>!0);st.registerFlag("WEBGL_FORCE_F16_TEXTURES",()=>!1);st.registerFlag("WEBGL_PACK",()=>st.getBool("HAS_WEBGL"));st.registerFlag("WEBGL_PACK_NORMALIZATION",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_CLIP",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_DEPTHWISECONV",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_BINARY_OPERATIONS",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_UNARY_OPERATIONS",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_ARRAY_OPERATIONS",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_IMAGE_OPERATIONS",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_PACK_REDUCE",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_LAZILY_UNPACK",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_CONV_IM2COL",()=>st.getBool("WEBGL_PACK"));st.registerFlag("WEBGL_MAX_TEXTURE_SIZE",()=>cw(st.getNumber("WEBGL_VERSION")));st.registerFlag("WEBGL_MAX_TEXTURES_IN_SHADER",()=>pw(st.getNumber("WEBGL_VERSION")));st.registerFlag("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION",()=>{let r=st.getNumber("WEBGL_VERSION");return r===0?0:lw(r)});st.registerFlag("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE",()=>st.getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")>0&&!co.isMobile());st.registerFlag("WEBGL_RENDER_FLOAT32_CAPABLE",()=>uw(st.getNumber("WEBGL_VERSION")));st.registerFlag("WEBGL_RENDER_FLOAT32_ENABLED",()=>st.getBool("WEBGL_FORCE_F16_TEXTURES")?!1:st.getBool("WEBGL_RENDER_FLOAT32_CAPABLE"));st.registerFlag("WEBGL_DOWNLOAD_FLOAT_ENABLED",()=>mw(st.getNumber("WEBGL_VERSION")));st.registerFlag("WEBGL_FENCE_API_ENABLED",()=>fw(st.getNumber("WEBGL_VERSION")));st.registerFlag("WEBGL_SIZE_UPLOAD_UNIFORM",()=>st.getBool("WEBGL_RENDER_FLOAT32_ENABLED")?4:0);st.registerFlag("WEBGL_DELETE_TEXTURE_THRESHOLD",()=>-1,r=>{if(r<0&&r!==-1)throw new Error(`WEBGL_DELETE_TEXTURE_THRESHOLD must be -1 (indicating never delete) or at least 0, but got ${r}.`)});st.registerFlag("WEBGL_FLUSH_THRESHOLD",()=>co.isMobile()?1:-1,r=>{if(r<0&&r!==-1)throw new Error(`WEBGL_FLUSH_THRESHOLD must be -1 (indicating never manual flush) or at least 0, but got ${r}.`)});st.registerFlag("CPU_HANDOFF_SIZE_THRESHOLD",()=>128);st.registerFlag("WEBGL_USE_SHAPES_UNIFORMS",()=>!1);st.registerFlag("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD",()=>1e5);st.registerFlag("TOPK_K_CPU_HANDOFF_THRESHOLD",()=>128);st.registerFlag("WEBGL_EXP_CONV",()=>!1);st.registerFlag("SOFTWARE_WEBGL_ENABLED",()=>st.getBool("IS_TEST"));st.registerFlag("WEBGL_MAX_SIZE_FOR_NARROW_TEXTURE",()=>1/0);st.registerFlag("WEBGL_AUTO_SQUARIFY_NARROW_TEXTURE_SHAPE",()=>!1);st.registerFlag("WEBGL2_ISNAN_CUSTOM",()=>!1);function Vt(){let r,t,e,o,n,s,a,i,c,p;return F().getNumber("WEBGL_VERSION")===2?(r="#version 300 es",t="in",e="out",o="in",n="texture",s="outputColor",a="out vec4 outputColor;",i=F().getBool("WEBGL2_ISNAN_CUSTOM")?`
      bool isnan_custom(float val) {
        uint floatToUint = floatBitsToUint(val);
        return (floatToUint & 0x7fffffffu) > 0x7f800000u;
      }

      bvec4 isnan_custom(vec4 val) {
        return bvec4(isnan_custom(val.x),
          isnan_custom(val.y), isnan_custom(val.z), isnan_custom(val.w));
      }

      #define isnan(value) isnan_custom(value)
    `:"",c="",p=`
      #define round(value) newRound(value)
      int newRound(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 newRound(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    `):(r="",t="attribute",e="varying",o="varying",n="texture2D",s="gl_FragColor",a="",i=`
      #define isnan(value) isnan_custom(value)
      bool isnan_custom(float val) {
        return (val > 0. || val < 1. || val == 0.) ? false : true;
      }
      bvec4 isnan_custom(vec4 val) {
        return bvec4(isnan(val.x), isnan(val.y), isnan(val.z), isnan(val.w));
      }
    `,c=`
      uniform float INFINITY;

      bool isinf(float val) {
        return abs(val) == INFINITY;
      }
      bvec4 isinf(vec4 val) {
        return equal(abs(val), vec4(INFINITY));
      }
    `,p=`
      int round(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 round(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    `),{version:r,attribute:t,varyingVs:e,varyingFs:o,texture2D:n,output:s,defineOutput:a,defineSpecialNaN:i,defineSpecialInf:c,defineRound:p}}function fr(r,t,e="index"){let o=y.computeStrides(t);return o.map((n,s)=>{let a=`int ${r[s]} = ${e} / ${n}`,i=s===o.length-1?`int ${r[s+1]} = ${e} - ${r[s]} * ${n}`:`index -= ${r[s]} * ${n}`;return`${a}; ${i};`}).join("")}function Jn(r,t,e="index"){let o=y.computeStrides(t);return o.map((n,s)=>{let a=`int ${r[s]} = ${e} / outShapeStrides[${s}]`,i=s===o.length-1?`int ${r[s+1]} = ${e} - ${r[s]} * outShapeStrides[${s}]`:`index -= ${r[s]} * outShapeStrides[${s}]`;return`${a}; ${i};`}).join("")}function QL(r,t){let e=r.length,o=r.map(s=>`${t}[${s}]`),n=new Array(e-1);n[e-2]=o[e-1];for(let s=e-3;s>=0;--s)n[s]=`(${n[s+1]} * ${o[s+1]})`;return n}function dw(r,t,e="index"){let o=r.map((s,a)=>a),n=QL(o,t);return n.map((s,a)=>{let i=`int ${r[a]} = ${e} / ${n[a]}`,c=a===n.length-1?`int ${r[a+1]} = ${e} - ${r[a]} * ${n[a]}`:`index -= ${r[a]} * ${n[a]}`;return`${i}; ${c};`}).join("")}function hi(r){let t=y.computeStrides(r).map(e=>e.toString());return`
  int getFlatIndex(ivec3 coords) {
    return coords.x * ${t[0]} + coords.y * ${t[1]} + coords.z;
  }
`}function gi(){return`
  int getFlatIndex(ivec3 coords) {
    return coords.x * outShapeStrides[0] + coords.y * outShapeStrides[1] + coords.z;
  }
`}var Ul=`
  const float FLOAT_MAX = 1.70141184e38;
  const float FLOAT_MIN = 1.17549435e-38;

  lowp vec4 encode_float(highp float v) {
    if (isnan(v)) {
      return vec4(255, 255, 255, 255);
    }

    highp float av = abs(v);

    if(av < FLOAT_MIN) {
      return vec4(0.0, 0.0, 0.0, 0.0);
    } else if(v > FLOAT_MAX) {
      return vec4(0.0, 0.0, 128.0, 127.0) / 255.0;
    } else if(v < -FLOAT_MAX) {
      return vec4(0.0, 0.0,  128.0, 255.0) / 255.0;
    }

    highp vec4 c = vec4(0,0,0,0);

    highp float e = floor(log2(av));
    highp float m = exp2(fract(log2(av))) - 1.0;

    c[2] = floor(128.0 * m);
    m -= c[2] / 128.0;
    c[1] = floor(32768.0 * m);
    m -= c[1] / 32768.0;
    c[0] = floor(8388608.0 * m);

    highp float ebias = e + 127.0;
    c[3] = floor(ebias / 2.0);
    ebias -= c[3] * 2.0;
    c[2] += floor(ebias) * 128.0;

    c[3] += 128.0 * step(0.0, -v);

    return c / 255.0;
  }
`;var{getBroadcastDims:hw}=I;function gw(r,t,e){let o=[];if(r.forEach(f=>{let d=y.sizeFromShape(f.shapeInfo.logicalShape);if(f.shapeInfo.isUniform?o.push(`uniform float ${f.name}${d>1?`[${d}]`:""};`):(o.push(`uniform sampler2D ${f.name};`),o.push(`uniform int offset${f.name};`)),e.enableShapeUniforms){let{uniformShape:h}=Hl(e.packedInputs,f.shapeInfo.logicalShape,f.shapeInfo.texShape);switch(h.length){case 1:o.push(`uniform int ${f.name}Shape;`);break;case 2:o.push(`uniform ivec2 ${f.name}Shape;`);break;case 3:o.push(`uniform ivec3 ${f.name}Shape;`);break;case 4:o.push(`uniform ivec4 ${f.name}Shape;`);break;default:break}o.push(`uniform ivec2 ${f.name}TexShape;`)}}),e.enableShapeUniforms){switch(t.logicalShape.length){case 1:o.push("uniform int outShape;");break;case 2:o.push("uniform ivec2 outShape;"),o.push("uniform int outShapeStrides;");break;case 3:o.push("uniform ivec3 outShape;"),o.push("uniform ivec2 outShapeStrides;");break;case 4:o.push("uniform ivec4 outShape;"),o.push("uniform ivec3 outShapeStrides;");break;default:break}o.push("uniform ivec2 outTexShape;")}e.customUniforms&&e.customUniforms.forEach(f=>{o.push(`uniform ${f.type} ${f.name}${f.arrayIndex?`[${f.arrayIndex}]`:""};`)});let n=o.join(`
`),s=r.map(f=>JL(f,t,e.packedInputs,e.enableShapeUniforms)).join(`
`),a=t.texShape,i=Vt(),c=r3(i),p,l,u=s3(i);return t.isPacked?(p=t3(t.logicalShape,a,e.enableShapeUniforms),l=n3(i)):(p=e3(t.logicalShape,a,e.enableShapeUniforms),l=o3(i)),e.packedInputs&&(u+=p3),[u,c,l,n,p,s,e.userCode].join(`
`)}function yi(r,t=!1){let e=r.shapeInfo.logicalShape;switch(e.length){case 0:return T3(r,t);case 1:return w3(r,t);case 2:return I3(r,t);case 3:return k3(r,t);case 4:return $3(r,t);case 5:return R3(r);case 6:return A3(r);default:throw new Error(`${e.length}-D input sampling is not yet supported`)}}function xw(r,t){switch(r.shapeInfo.logicalShape.length){case 0:return C3(r);case 1:return S3(r,t);case 2:return N3(r,t);case 3:return v3(r,t);default:return E3(r,t)}}function JL(r,t,e=!1,o){let n="";e?n+=xw(r,o):n+=yi(r,o);let s=r.shapeInfo.logicalShape,a=t.logicalShape;return s.length<=a.length&&(e?n+=F3(r,t):n+=D3(r,t)),n}function t3(r,t,e){switch(r.length){case 0:return yw();case 1:return l3(r,t,e);case 2:return y3(r,t,e);case 3:return m3(r,t,e);default:return d3(r,t,e)}}function e3(r,t,e){switch(r.length){case 0:return yw();case 1:return u3(r,t,e);case 2:return b3(r,t,e);case 3:return f3(r,t,e);case 4:return h3(r,t,e);case 5:return g3(r,t);case 6:return x3(r,t);default:throw new Error(`${r.length}-D output sampling is not yet supported`)}}function r3(r){return`
    float sampleTexture(sampler2D textureSampler, vec2 uv) {
      return ${r.texture2D}(textureSampler, uv).r;
    }
  `}function o3(r){return`
    void setOutput(float val) {
      ${r.output} = vec4(val, 0, 0, 0);
    }
  `}function n3(r){return`
    void setOutput(vec4 val) {
      ${r.output} = val;
    }
  `}function s3(r){return`${r.version}
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    ${r.varyingFs} vec2 resultUV;
    ${r.defineOutput}
    const vec2 halfCR = vec2(0.5, 0.5);

    struct ivec5
    {
      int x;
      int y;
      int z;
      int w;
      int u;
    };

    struct ivec6
    {
      int x;
      int y;
      int z;
      int w;
      int u;
      int v;
    };

    uniform float NAN;
    ${r.defineSpecialNaN}
    ${r.defineSpecialInf}
    ${r.defineRound}

    int imod(int x, int y) {
      return x - y * (x / y);
    }

    int idiv(int a, int b, float sign) {
      int res = a / b;
      int mod = imod(a, b);
      if (sign < 0. && mod != 0) {
        res -= 1;
      }
      return res;
    }

    //Based on the work of Dave Hoskins
    //https://www.shadertoy.com/view/4djSRW
    #define HASHSCALE1 443.8975
    float random(float seed){
      vec2 p = resultUV * seed;
      vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
      p3 += dot(p3, p3.yzx + 19.19);
      return fract((p3.x + p3.y) * p3.z);
    }

    ${a3}
    ${i3}
    ${c3}
  `}var a3=`
vec2 uvFromFlat(int texNumR, int texNumC, int index) {
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
vec2 packedUVfrom1D(int texNumR, int texNumC, int index) {
  int texelIndex = index / 2;
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,i3=`
vec2 packedUVfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,c3=`
vec2 packedUVfrom3D(int texNumR, int texNumC,
    int texelsInBatch, int texelsInLogicalRow, int b,
    int row, int col) {
  int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,p3=`
  float getChannel(vec4 frag, vec2 innerDims) {
    vec2 modCoord = mod(innerDims, 2.);
    return modCoord.x == 0. ?
      (modCoord.y == 0. ? frag.r : frag.g) :
      (modCoord.y == 0. ? frag.b : frag.a);
  }
  float getChannel(vec4 frag, int dim) {
    float modCoord = mod(float(dim), 2.);
    return modCoord == 0. ? frag.r : frag.g;
  }
`;function yw(){return`
    int getOutputCoords() {
      return 0;
    }
  `}function l3(r,t,e){let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)];return o[0]===1?e?`
      int getOutputCoords() {
        return 2 * int(resultUV.x * ceil(float(outTexShape[1]) / 2.0));
      }
    `:`
      int getOutputCoords() {
        return 2 * int(resultUV.x * ${o[1]}.0);
      }
    `:o[1]===1?e?`
      int getOutputCoords() {
        return 2 * int(resultUV.y * ceil(float(outTexShape[0]) / 2.0));
      }
    `:`
      int getOutputCoords() {
        return 2 * int(resultUV.y * ${o[0]}.0);
      }
    `:e?`
    int getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      return 2 * (resTexRC.x * packedTexShape[1] + resTexRC.y);
    }
  `:`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      return 2 * (resTexRC.x * ${o[1]} + resTexRC.y);
    }
  `}function u3(r,t,e){return t[0]===1?e?`
      int getOutputCoords() {
        return int(resultUV.x * float(outTexShape[1]));
      }
    `:`
      int getOutputCoords() {
        return int(resultUV.x * ${t[1]}.0);
      }
    `:t[1]===1?e?`
      int getOutputCoords() {
        return int(resultUV.y * float(outTexShape[0]));
      }
    `:`
      int getOutputCoords() {
        return int(resultUV.y * ${t[0]}.0);
      }
    `:e?`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(outTexShape[0], outTexShape[1]));
      return resTexRC.x * outTexShape[1] + resTexRC.y;
    }
  `:`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${t[0]}, ${t[1]}));
      return resTexRC.x * ${t[1]} + resTexRC.y;
    }
  `}function m3(r,t,e){if(e)return`
    ivec3 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      int texelsInLogicalRow = int(ceil(float(outShape[2]) / 2.0));
      int texelsInBatch = texelsInLogicalRow * int(ceil(float(outShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;

      int b = index / texelsInBatch;
      index -= b * texelsInBatch;

      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec3(b, r, c);
    }
  `;let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)],n=Math.ceil(r[2]/2),s=n*Math.ceil(r[1]/2);return`
    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      int index = resTexRC.x * ${o[1]} + resTexRC.y;

      int b = index / ${s};
      index -= b * ${s};

      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec3(b, r, c);
    }
  `}function f3(r,t,e){if(e)return`
  ivec3 getOutputCoords() {
    ivec2 resTexRC = ivec2(resultUV.yx *
                           vec2(outTexShape[0], outTexShape[1]));
    int index = resTexRC.x * outTexShape[1] + resTexRC.y;
    ${Jn(["r","c","d"],r)}
    return ivec3(r, c, d);
  }
`;let o=fr(["r","c","d"],r);return`
    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;
      ${o}
      return ivec3(r, c, d);
    }
  `}function d3(r,t,e){if(e)return`
    ivec4 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;

      int texelsInLogicalRow = int(ceil(float(outShape[3]) / 2.0));
      int texelsInBatch = texelsInLogicalRow * int(ceil(float(outShape[2]) / 2.0));
      int texelsInBatchN = texelsInBatch * outShape[1];

      int b2 = index / texelsInBatchN;
      index -= b2 * texelsInBatchN;

      int b = index / texelsInBatch;
      index -= b * texelsInBatch;

      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec4(b2, b, r, c);
    }
  `;let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)],n=Math.ceil(r[r.length-1]/2),s=n*Math.ceil(r[r.length-2]/2),a=s,i="",c="b, r, c";for(let p=2;p<r.length-1;p++)a*=r[r.length-p-1],i=`
      int b${p} = index / ${a};
      index -= b${p} * ${a};
    `+i,c=`b${p}, `+c;return`
    ivec${r.length} getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      int index = resTexRC.x * ${o[1]} + resTexRC.y;

      ${i}

      int b = index / ${s};
      index -= b * ${s};

      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec${r.length}(${c});
    }
  `}function h3(r,t,e){if(e)return`
    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(outTexShape[0], outTexShape[1]));
      int index = resTexRC.x * outTexShape[1] + resTexRC.y;
      ${Jn(["r","c","d","d2"],r)}
      return ivec4(r, c, d, d2);
    }
  `;let o=fr(["r","c","d","d2"],r);return`
    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;
      ${o}
      return ivec4(r, c, d, d2);
    }
  `}function g3(r,t){let e=fr(["r","c","d","d2","d3"],r);return`
    ivec5 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx * vec2(${t[0]},
                             ${t[1]}));

      int index = resTexRC.x * ${t[1]} + resTexRC.y;

      ${e}

      ivec5 outShape = ivec5(r, c, d, d2, d3);
      return outShape;
    }
  `}function x3(r,t){let e=fr(["r","c","d","d2","d3","d4"],r);return`
    ivec6 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;

      ${e}

      ivec6 result = ivec6(r, c, d, d2, d3, d4);
      return result;
    }
  `}function y3(r,t,e){let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)];if(y.arraysEqual(r,t))return e?`
      ivec2 getOutputCoords() {
        ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
        return 2 * ivec2(resultUV.yx * vec2(packedTexShape[0], packedTexShape[1]));
      }
    `:`
      ivec2 getOutputCoords() {
        return 2 * ivec2(resultUV.yx * vec2(${o[0]}, ${o[1]}));
      }
    `;let n=Math.ceil(r[1]/2);return e?`
    ivec2 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      int texelsInLogicalRow = int(ceil(float(outShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));

      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;
      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec2(r, c);
    }
  `:`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));

      int index = resTexRC.x * ${o[1]} + resTexRC.y;
      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec2(r, c);
    }
  `}function b3(r,t,e){return y.arraysEqual(r,t)?e?`
      ivec2 getOutputCoords() {
        return ivec2(resultUV.yx * vec2(outTexShape[0], outTexShape[1]));
      }
    `:`
      ivec2 getOutputCoords() {
        return ivec2(resultUV.yx * vec2(${t[0]}, ${t[1]}));
      }
    `:r[1]===1?e?`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(outTexShape[0], outTexShape[1]));
        int index = resTexRC.x * outTexShape[1] + resTexRC.y;
        return ivec2(index, 0);
      }
    `:`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(${t[0]}, ${t[1]}));
        int index = resTexRC.x * ${t[1]} + resTexRC.y;
        return ivec2(index, 0);
      }
    `:r[0]===1?e?`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(outTexShape[0], outTexShape[1]));
        int index = resTexRC.x * outTexShape[1] + resTexRC.y;
        return ivec2(0, index);
      }
    `:`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(${t[0]}, ${t[1]}));
        int index = resTexRC.x * ${t[1]} + resTexRC.y;
        return ivec2(0, index);
      }
    `:e?`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(outTexShape[0], outTexShape[1]));
      int index = resTexRC.x * outTexShape[1] + resTexRC.y;
      int r = index / outShape[1];
      int c = index - r * outShape[1];
      return ivec2(r, c);
    }
  `:`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;
      int r = index / ${r[1]};
      int c = index - r * ${r[1]};
      return ivec2(r, c);
    }
  `}function ts(r){return`offset${r}`}function C3(r){let t=r.name,e="get"+t.charAt(0).toUpperCase()+t.slice(1),o=Vt();return`
    vec4 ${e}() {
      return ${o.texture2D}(${t}, halfCR);
    }
  `}function T3(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1);if(r.shapeInfo.isUniform)return`float ${o}() {return ${e};}`;let[n,s]=r.shapeInfo.texShape;if(n===1&&s===1)return`
      float ${o}() {
        return sampleTexture(${e}, halfCR);
      }
    `;let a=ts(e);if(t)return`
    float ${o}() {
      vec2 uv = uvFromFlat(${e}TexShape[0], ${e}TexShape[1], ${a});
      return sampleTexture(${e}, uv);
    }
  `;let[i,c]=r.shapeInfo.texShape;return`
    float ${o}() {
      vec2 uv = uvFromFlat(${i}, ${c}, ${a});
      return sampleTexture(${e}, uv);
    }
  `}function S3(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),n=r.shapeInfo.texShape,s=Vt();if(t)return`
    vec4 ${o}(int index) {
      ivec2 packedTexShape = ivec2(ceil(float(${e}TexShape[0]) / 2.0), ceil(float(${e}TexShape[1]) / 2.0));
      vec2 uv = packedUVfrom1D(
        packedTexShape[0], packedTexShape[1], index);
      return ${s.texture2D}(${e}, uv);
    }
  `;let a=[Math.ceil(n[0]/2),Math.ceil(n[1]/2)];return`
    vec4 ${o}(int index) {
      vec2 uv = packedUVfrom1D(
        ${a[0]}, ${a[1]}, index);
      return ${s.texture2D}(${e}, uv);
    }
  `}function w3(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1);if(r.shapeInfo.isUniform)return`
      float ${o}(int index) {
        ${bi(r)}
      }
    `;let n=r.shapeInfo.texShape,s=n[0],a=n[1];if(a===1&&s===1)return`
      float ${o}(int index) {
        return sampleTexture(${e}, halfCR);
      }
    `;let i=ts(e);return a===1?t?`
      float ${o}(int index) {
        vec2 uv = vec2(0.5, (float(index + ${i}) + 0.5) / float(${e}TexShape[0]));
        return sampleTexture(${e}, uv);
      }
    `:`
      float ${o}(int index) {
        vec2 uv = vec2(0.5, (float(index + ${i}) + 0.5) / ${s}.0);
        return sampleTexture(${e}, uv);
      }
    `:s===1?t?`
      float ${o}(int index) {
        vec2 uv = vec2((float(index + ${i}) + 0.5) / float(${e}TexShape[1]), 0.5);
        return sampleTexture(${e}, uv);
      }
    `:`
      float ${o}(int index) {
        vec2 uv = vec2((float(index + ${i}) + 0.5) / ${a}.0, 0.5);
        return sampleTexture(${e}, uv);
      }
    `:t?`
    float ${o}(int index) {
      vec2 uv = uvFromFlat(${e}TexShape[0], ${e}TexShape[1], index + ${i});
      return sampleTexture(${e}, uv);
    }
  `:`
    float ${o}(int index) {
      vec2 uv = uvFromFlat(${s}, ${a}, index + ${i});
      return sampleTexture(${e}, uv);
    }
  `}function N3(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape,a=s[0],i=s[1],c=Vt();if(s!=null&&y.arraysEqual(e,s))return t?`
      vec4 ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);

        return ${c.texture2D}(${o}, uv);
      }
    `:`
      vec4 ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${i}.0, ${a}.0);

        return ${c.texture2D}(${o}, uv);
      }
    `;if(t)return`
    vec4 ${n}(int row, int col) {
      ivec2 packedTexShape = ivec2(ceil(float(${o}TexShape[0]) / 2.0), ceil(float(${o}TexShape[1]) / 2.0));
      int valuesPerRow = int(ceil(float(${o}Shape[1]) / 2.0));
      vec2 uv = packedUVfrom2D(valuesPerRow, packedTexShape[0], packedTexShape[1], row, col);
      return ${c.texture2D}(${o}, uv);
    }
  `;let p=[Math.ceil(s[0]/2),Math.ceil(s[1]/2)],l=Math.ceil(e[1]/2);return`
    vec4 ${n}(int row, int col) {
      vec2 uv = packedUVfrom2D(${l}, ${p[0]}, ${p[1]}, row, col);
      return ${c.texture2D}(${o}, uv);
    }
  `}function I3(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape;if(s!=null&&y.arraysEqual(e,s)){if(t)return`
      float ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `;let m=s[0],f=s[1];return`
    float ${n}(int row, int col) {
      vec2 uv = (vec2(col, row) + halfCR) / vec2(${f}.0, ${m}.0);
      return sampleTexture(${o}, uv);
    }
  `}let{newShape:a,keptDims:i}=y.squeezeShape(e),c=a;if(c.length<e.length){let m=Ci(r,c),f=["row","col"];return`
      ${yi(m,t)}
      float ${n}(int row, int col) {
        return ${n}(${Ti(f,i)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col) {
        int index = round(dot(vec2(row, col), vec2(${e[1]}, 1)));
        ${bi(r)}
      }
    `;let p=s[0],l=s[1],u=ts(o);return l===1?t?`
      float ${n}(int row, int col) {
        float index = dot(vec3(row, col, ${u}), vec3(${o}Shape[1], 1, 1));
        vec2 uv = vec2(0.5, (index + 0.5) / float(${o}TexShape[0]));
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col) {
      float index = dot(vec3(row, col, ${u}), vec3(${e[1]}, 1, 1));
      vec2 uv = vec2(0.5, (index + 0.5) / ${p}.0);
      return sampleTexture(${o}, uv);
    }
  `:p===1?t?`
      float ${n}(int row, int col) {
        float index = dot(vec3(row, col, ${u}), vec3(${o}Shape[1], 1, 1));
        vec2 uv = vec2((index + 0.5) / float(${o}TexShape[1]), 0.5);
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col) {
      float index = dot(vec3(row, col, ${u}), vec3(${e[1]}, 1, 1));
      vec2 uv = vec2((index + 0.5) / ${l}.0, 0.5);
      return sampleTexture(${o}, uv);
    }
  `:t?`
      float ${n}(int row, int col) {
        // Explicitly use integer operations as dot() only works on floats.
        int index = row * ${o}Shape[1] + col + ${u};
        vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index);
        return sampleTexture(${o}, uv);
      }
    `:`
  float ${n}(int row, int col) {
    // Explicitly use integer operations as dot() only works on floats.
    int index = row * ${e[1]} + col + ${u};
    vec2 uv = uvFromFlat(${p}, ${l}, index);
    return sampleTexture(${o}, uv);
  }
`}function v3(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape,a=[Math.ceil(s[0]/2),Math.ceil(s[1]/2)];if(e[0]===1){let m=e.slice(1),f=[1,2],d=Ci(r,m),h=["b","row","col"];return`
        ${xw(d,t)}
        vec4 ${n}(int b, int row, int col) {
          return ${n}(${Ti(h,f)});
        }
      `}let i=Vt();if(t)return`
    vec4 ${n}(int b, int row, int col) {
      ivec2 packedTexShape = ivec2(ceil(float(${o}TexShape[0]) / 2.0), ceil(float(${o}TexShape[1]) / 2.0));
      int valuesPerRow = int(ceil(float(${o}Shape[2]) / 2.0));
      int texelsInBatch = valuesPerRow * int(ceil(float(${o}Shape[1]) / 2.0));
      vec2 uv = packedUVfrom3D(
        packedTexShape[0], packedTexShape[1], texelsInBatch, valuesPerRow, b, row, col);
      return ${i.texture2D}(${o}, uv);
    }
  `;let c=a[0],p=a[1],l=Math.ceil(e[2]/2),u=l*Math.ceil(e[1]/2);return`
    vec4 ${n}(int b, int row, int col) {
      vec2 uv = packedUVfrom3D(
        ${c}, ${p}, ${u}, ${l}, b, row, col);
      return ${i.texture2D}(${o}, uv);
    }
  `}function k3(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=e[1]*e[2],a=e[2],{newShape:i,keptDims:c}=y.squeezeShape(e),p=i;if(p.length<e.length){let h=Ci(r,p),g=["row","col","depth"];return`
        ${yi(h,t)}
        float ${n}(int row, int col, int depth) {
          return ${n}(${Ti(g,c)});
        }
      `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col, int depth) {
        int index = round(dot(vec3(row, col, depth),
                          vec3(${s}, ${a}, 1)));
        ${bi(r)}
      }
    `;let l=r.shapeInfo.texShape,u=l[0],m=l[1],f=r.shapeInfo.flatOffset;if(m===s&&f==null)return t?`
      float ${n}(int row, int col, int depth) {
        int stride1 = ${o}Shape[2];
        float texR = float(row);
        float texC = dot(vec2(col, depth), vec2(stride1, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
        float ${n}(int row, int col, int depth) {
          float texR = float(row);
          float texC = dot(vec2(col, depth), vec2(${a}, 1));
          vec2 uv = (vec2(texC, texR) + halfCR) /
                     vec2(${m}.0, ${u}.0);
          return sampleTexture(${o}, uv);
        }
      `;if(m===a&&f==null)return t?`
      float ${n}(int row, int col, int depth) {
        float texR = dot(vec2(row, col), vec2(${o}Shape[1], 1));
        float texC = float(depth);
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col, int depth) {
      float texR = dot(vec2(row, col), vec2(${e[1]}, 1));
      float texC = float(depth);
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${m}.0, ${u}.0);
      return sampleTexture(${o}, uv);
    }
  `;let d=ts(o);return t?`
    float ${n}(int row, int col, int depth) {
      // Explicitly use integer operations as dot() only works on floats.
      int stride0 = ${o}Shape[1] * ${o}Shape[2];
      int stride1 = ${o}Shape[2];
      int index = row * stride0 + col * stride1 + depth + ${d};
      vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index);
      return sampleTexture(${o}, uv);
    }
    `:`
      float ${n}(int row, int col, int depth) {
        // Explicitly use integer operations as dot() only works on floats.
        int index = row * ${s} + col * ${a} + depth + ${d};
        vec2 uv = uvFromFlat(${u}, ${m}, index);
        return sampleTexture(${o}, uv);
      }
  `}function E3(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),n=Vt();if(t)return`
    vec4 ${o}(int b2, int b, int row, int col) {
      int valuesPerRow = int(ceil(float(${e}Shape[3]) / 2.0));
      int texelsInBatch = valuesPerRow * int(ceil(float(${e}Shape[2]) / 2.0));
      int index = b * texelsInBatch + (row / 2) * valuesPerRow + (col / 2);
      texelsInBatch *= ${e}Shape[1];
      index = b2 * texelsInBatch + index;
      ivec2 packedTexShape = ivec2(ceil(float(${e}TexShape[0]) / 2.0), ceil(float(${e}TexShape[1]) / 2.0));
      int texR = index / packedTexShape[1];
      int texC = index - texR * packedTexShape[1];
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(packedTexShape[1], packedTexShape[0]); return ${n.texture2D}(${e}, uv);
    }
  `;let s=r.shapeInfo.logicalShape,a=s.length,i=r.shapeInfo.texShape,c=[Math.ceil(i[0]/2),Math.ceil(i[1]/2)],p=c[0],l=c[1],u=Math.ceil(s[a-1]/2),m=u*Math.ceil(s[a-2]/2),f="int b, int row, int col",d=`b * ${m} + (row / 2) * ${u} + (col / 2)`;for(let h=2;h<a-1;h++)f=`int b${h}, `+f,m*=s[a-h-1],d=`b${h} * ${m} + `+d;return`
    vec4 ${o}(${f}) {
      int index = ${d};
      int texR = index / ${l};
      int texC = index - texR * ${l};
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${l}, ${p});
      return ${n.texture2D}(${e}, uv);
    }
  `}function $3(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=e[3],a=e[2]*s,i=e[1]*a,{newShape:c,keptDims:p}=y.squeezeShape(e);if(c.length<e.length){let b=Ci(r,c),S=["row","col","depth","depth2"];return`
      ${yi(b,t)}
      float ${n}(int row, int col, int depth, int depth2) {
        return ${n}(${Ti(S,p)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col, int depth, int depth2) {
        int index = round(dot(vec4(row, col, depth, depth2),
                          vec4(${i}, ${a}, ${s}, 1)));
        ${bi(r)}
      }
    `;let l=r.shapeInfo.flatOffset,u=r.shapeInfo.texShape,m=u[0],f=u[1],d=`int stride2 = ${o}Shape[3];`,h=`int stride1 = ${o}Shape[2] * stride2;`,g=`int stride0 = ${o}Shape[1] * stride1;`;if(f===i&&l==null)return t?`
      float ${n}(int row, int col, int depth, int depth2) {
        ${d}
        ${h}
        float texR = float(row);
        float texC =
            dot(vec3(col, depth, depth2),
                vec3(stride1, stride2, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = float(row);
        float texC =
            dot(vec3(col, depth, depth2),
                vec3(${a}, ${s}, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${f}.0, ${m}.0);
        return sampleTexture(${o}, uv);
      }
    `;if(f===s&&l==null)return t?`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(${o}Shape[1] * ${o}Shape[2], ${o}Shape[2], 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(${e[1]*e[2]}, ${e[2]}, 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${f}.0, ${m}.0);
        return sampleTexture(${o}, uv);
      }
    `;let x=ts(o);return t?`
    float ${n}(int row, int col, int depth, int depth2) {
      // Explicitly use integer operations as dot() only works on floats.
      ${d}
      ${h}
      ${g}
      int index = row * stride0 + col * stride1 +
          depth * stride2 + depth2;
      vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index + ${x});
      return sampleTexture(${o}, uv);
    }
  `:`
    float ${n}(int row, int col, int depth, int depth2) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${i} + col * ${a} +
          depth * ${s} + depth2;
      vec2 uv = uvFromFlat(${m}, ${f}, index + ${x});
      return sampleTexture(${o}, uv);
    }
  `}function R3(r){let t=r.shapeInfo.logicalShape,e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),n=t[4],s=t[3]*n,a=t[2]*s,i=t[1]*a,{newShape:c,keptDims:p}=y.squeezeShape(t);if(c.length<t.length){let h=Ci(r,c),g=["row","col","depth","depth2","depth3"];return`
      ${yi(h)}
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        return ${o}(${Ti(g,p)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        float index = dot(
          vec4(row, col, depth, depth2),
          vec4(${i}, ${a}, ${s}, ${n})) +
          depth3;
        ${bi(r)}
      }
    `;let l=r.shapeInfo.flatOffset,u=r.shapeInfo.texShape,m=u[0],f=u[1];if(f===i&&l==null)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        int texR = row;
        float texC = dot(vec4(col, depth, depth2, depth3),
                         vec4(${a}, ${s}, ${n}, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${f}.0, ${m}.0);
        return sampleTexture(${e}, uv);
      }
    `;if(f===n&&l==null)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        float texR = dot(
          vec4(row, col, depth, depth2),
          vec4(${t[1]*t[2]*t[3]},
               ${t[2]*t[3]}, ${t[3]}, 1));
        int texC = depth3;
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${f}.0, ${m}.0);
        return sampleTexture(${e}, uv);
      }
    `;let d=ts(e);return`
    float ${o}(int row, int col, int depth, int depth2, int depth3) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${i} + col * ${a} + depth * ${s} +
          depth2 * ${n} + depth3 + ${d};
      vec2 uv = uvFromFlat(${m}, ${f}, index);
      return sampleTexture(${e}, uv);
    }
  `}function A3(r){let t=r.shapeInfo.logicalShape,e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),{newShape:n,keptDims:s}=y.squeezeShape(t);if(n.length<t.length){let g=Ci(r,n),x=["row","col","depth","depth2","depth3","depth4"];return`
      ${yi(g)}
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        return ${o}(${Ti(x,s)});
      }
    `}let a=t[5],i=t[4]*a,c=t[3]*i,p=t[2]*c,l=t[1]*p;if(r.shapeInfo.isUniform)return`
      float ${o}(int row, int col, int depth,
                  int depth2, int depth3, int depth4) {
        int index = round(dot(
          vec4(row, col, depth, depth2),
          vec4(${l}, ${p}, ${c}, ${i})) +
          dot(
            vec2(depth3, depth4),
            vec2(${a}, 1)));
        ${bi(r)}
      }
    `;let u=r.shapeInfo.flatOffset,m=r.shapeInfo.texShape,f=m[0],d=m[1];if(d===l&&u==null)return`
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        int texR = row;
        float texC = dot(vec4(col, depth, depth2, depth3),
          vec4(${p}, ${c}, ${i}, ${a})) +
               float(depth4);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${d}.0, ${f}.0);
        return sampleTexture(${e}, uv);
      }
    `;if(d===a&&u==null)return`
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        float texR = dot(vec4(row, col, depth, depth2),
          vec4(${t[1]*t[2]*t[3]*t[4]},
               ${t[2]*t[3]*t[4]},
               ${t[3]*t[4]},
               ${t[4]})) + float(depth3);
        int texC = depth4;
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${d}.0, ${f}.0);
        return sampleTexture(${e}, uv);
      }
    `;let h=ts(e);return`
    float ${o}(int row, int col, int depth,
                  int depth2, int depth3, int depth4) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${l} + col * ${p} + depth * ${c} +
          depth2 * ${i} + depth3 * ${a} + depth4 + ${h};
      vec2 uv = uvFromFlat(${f}, ${d}, index);
      return sampleTexture(${e}, uv);
    }
  `}function bi(r){let t=r.name,e=y.sizeFromShape(r.shapeInfo.logicalShape);return e<2?`return ${t};`:`
    for (int i = 0; i < ${e}; i++) {
      if (i == index) {
        return ${t}[i];
      }
    }
  `}function F3(r,t){let e=r.name,o=e.charAt(0).toUpperCase()+e.slice(1),n="get"+o+"AtOutCoords",s=r.shapeInfo.logicalShape.length,a=t.logicalShape.length,i=hw(r.shapeInfo.logicalShape,t.logicalShape),c=mt(a),p=a-s,l,u=["x","y","z","w","u","v"];s===0?l="":a<2&&i.length>=1?l="coords = 0;":l=i.map(b=>`coords.${u[b+p]} = 0;`).join(`
`);let m="";a<2&&s>0?m="coords":m=r.shapeInfo.logicalShape.map((b,S)=>`coords.${u[S+p]}`).join(", ");let f="return outputValue;",h=y.sizeFromShape(r.shapeInfo.logicalShape)===1,x=y.sizeFromShape(t.logicalShape)===1;if(s===1&&!h&&!x)f=`
      return vec4(outputValue.xy, outputValue.xy);
    `;else if(h&&!x)a===1?f=`
        return vec4(outputValue.x, outputValue.x, 0., 0.);
      `:f=`
        return vec4(outputValue.x);
      `;else if(i.length){let b=s-2,S=s-1;i.indexOf(b)>-1&&i.indexOf(S)>-1?f="return vec4(outputValue.x);":i.indexOf(b)>-1?f="return vec4(outputValue.x, outputValue.y, outputValue.x, outputValue.y);":i.indexOf(S)>-1&&(f="return vec4(outputValue.xx, outputValue.zz);")}return`
    vec4 ${n}() {
      ${c} coords = getOutputCoords();
      ${l}
      vec4 outputValue = get${o}(${m});
      ${f}
    }
  `}function D3(r,t){let e=r.name,o=e.charAt(0).toUpperCase()+e.slice(1),n="get"+o+"AtOutCoords",s=t.texShape,a=r.shapeInfo.texShape,i=r.shapeInfo.logicalShape.length,c=t.logicalShape.length;if(!r.shapeInfo.isUniform&&i===c&&r.shapeInfo.flatOffset==null&&y.arraysEqual(a,s))return`
      float ${n}() {
        return sampleTexture(${e}, resultUV);
      }
    `;let p=mt(c),l=hw(r.shapeInfo.logicalShape,t.logicalShape),u=c-i,m,f=["x","y","z","w","u","v"];i===0?m="":c<2&&l.length>=1?m="coords = 0;":m=l.map(h=>`coords.${f[h+u]} = 0;`).join(`
`);let d="";return c<2&&i>0?d="coords":d=r.shapeInfo.logicalShape.map((h,g)=>`coords.${f[g+u]}`).join(", "),`
    float ${n}() {
      ${p} coords = getOutputCoords();
      ${m}
      return get${o}(${d});
    }
  `}function mt(r){if(r<=1)return"int";if(r===2)return"ivec2";if(r===3)return"ivec3";if(r===4)return"ivec4";if(r===5)return"ivec5";if(r===6)return"ivec6";throw Error(`GPU for rank ${r} is not yet supported`)}function Hl(r,t,e){let{newShape:o,keptDims:n}=y.squeezeShape(t),s=t.length,a=r&&s===3&&t[0]===1,i=a?t.slice(1):o,c=!r&&s>1&&!y.arraysEqual(t,e)&&o.length<s||a;return{useSqueezeShape:c,uniformShape:c?i:t,keptDims:n}}function Ci(r,t){let e=JSON.parse(JSON.stringify(r));return e.shapeInfo.logicalShape=t,e}function Ti(r,t){return t.map(e=>r[e]).join(", ")}function Cw(r,t,e,o){let n=e.map((l,u)=>{let m={logicalShape:l.shape,texShape:l.isUniform?null:l.texData.texShape,isUniform:l.isUniform,isPacked:l.isUniform?!1:l.texData.isPacked,flatOffset:null};return l.texData!=null&&l.texData.slice!=null&&l.texData.slice.flatOffset>0&&(m.flatOffset=l.texData.slice.flatOffset),{name:t.variableNames[u],shapeInfo:m}}),s=n.map(l=>l.shapeInfo),a={logicalShape:o.shape,texShape:o.texData.texShape,isUniform:!1,isPacked:o.texData.isPacked,flatOffset:null},i=gw(n,a,t),c=YS(r.gl,i),p=r.createProgram(c);return F().get("ENGINE_COMPILE_ONLY")?{program:t,fragmentShader:c,source:i,webGLProgram:p,inShapeInfos:s,outShapeInfo:a,uniformLocations:null,customUniformLocations:null,infLoc:null,nanLoc:null,inShapesLocations:null,inTexShapesLocations:null,outShapeLocation:null,outShapeStridesLocation:null,outTexShapeLocation:null}:Object.assign({program:t,fragmentShader:c,source:i,webGLProgram:p,inShapeInfos:s,outShapeInfo:a},Qd(r,t,p))}function Qd(r,t,e){let o={},n={},s={},a=[],i,c,p,l=null,u=null;u=r.getUniformLocation(e,"NAN",!1),F().getNumber("WEBGL_VERSION")===1&&(l=r.getUniformLocation(e,"INFINITY",!1));let m=!1;for(let f=0;f<t.variableNames.length;f++){let d=t.variableNames[f];o[d]=r.getUniformLocation(e,d,m),o[`offset${d}`]=r.getUniformLocation(e,`offset${d}`,m),t.enableShapeUniforms&&(n[`${d}Shape`]=r.getUniformLocation(e,`${d}Shape`,m),s[`${d}TexShape`]=r.getUniformLocation(e,`${d}TexShape`,m))}return t.enableShapeUniforms&&(i=r.getUniformLocation(e,"outShape",m),p=r.getUniformLocation(e,"outShapeStrides",m),c=r.getUniformLocation(e,"outTexShape",m)),t.customUniforms&&t.customUniforms.forEach((f,d)=>{a[d]=r.getUniformLocation(e,f.name,m)}),{uniformLocations:o,customUniformLocations:a,infLoc:l,nanLoc:u,inShapesLocations:n,inTexShapesLocations:s,outShapeLocation:i,outShapeStridesLocation:p,outTexShapeLocation:c}}function bw(r,t){if(r.length!==t.length)throw Error(`Binary was compiled with ${r.length} inputs, but was executed with ${t.length} inputs`);r.forEach((e,o)=>{let n=e.logicalShape,s=t[o],a=s.shape;if(!y.arraysEqual(n,a))throw Error(`Binary was compiled with different shapes than the current args. Shapes ${n} and ${a} must match`);if(e.isUniform&&s.isUniform)return;let i=e.texShape,c=s.isUniform?null:s.texData.texShape;if(!y.arraysEqual(i,c))throw Error(`Binary was compiled with different texture shapes than the current args. Shape ${i} and ${c} must match`)})}function Tw(r,t,e,o,n){t.program.enableShapeUniforms||(bw(t.inShapeInfos,e),bw([t.outShapeInfo],[o]));let s=o.texData.texture,a=o.texData.texShape;o.texData.isPacked?r.setOutputPackedMatrixTexture(s.texture,a[0],a[1]):r.setOutputMatrixTexture(s.texture,a[0],a[1]),r.setProgram(t.webGLProgram),F().getNumber("WEBGL_VERSION")===1&&t.infLoc!==null&&r.gl.uniform1f(t.infLoc,1/0),t.nanLoc!==null&&r.gl.uniform1f(t.nanLoc,NaN),e.forEach((c,p)=>{let l=t.program.variableNames[p],u=t.uniformLocations[l],m=t.uniformLocations[`offset${l}`],f=t.inShapesLocations[`${l}Shape`],d=t.inTexShapesLocations[`${l}TexShape`];if(f){let{uniformShape:h}=Hl(t.program.packedInputs,c.shape,c.texData.texShape);switch(h.length){case 1:r.gl.uniform1iv(f,new Int32Array(h));break;case 2:r.gl.uniform2iv(f,new Int32Array(h));break;case 3:r.gl.uniform3iv(f,new Int32Array(h));break;case 4:r.gl.uniform4iv(f,new Int32Array(h));break;default:break}}if(d&&r.gl.uniform2i(d,c.texData.texShape[0],c.texData.texShape[1]),u!=null){if(c.isUniform){if(y.sizeFromShape(c.shape)<2)r.gl.uniform1f(u,c.uniformValues[0]);else{let h=c.uniformValues;h instanceof Float32Array||(h=new Float32Array(h)),r.gl.uniform1fv(u,h)}return}c.texData.slice!=null&&m!=null&&r.gl.uniform1i(m,c.texData.slice.flatOffset),r.setInputMatrixTexture(c.texData.texture.texture,u,p)}});let i=t.outShapeLocation;if(i)switch(o.shape.length){case 1:r.gl.uniform1iv(i,new Int32Array(o.shape));break;case 2:r.gl.uniform2iv(i,new Int32Array(o.shape));break;case 3:r.gl.uniform3iv(i,new Int32Array(o.shape));break;case 4:r.gl.uniform4iv(i,new Int32Array(o.shape));break;default:break}if(t.outShapeStridesLocation){let c=y.computeStrides(o.shape);switch(o.shape.length){case 2:r.gl.uniform1iv(t.outShapeStridesLocation,new Int32Array(c));break;case 3:r.gl.uniform2iv(t.outShapeStridesLocation,new Int32Array(c));break;case 4:r.gl.uniform3iv(t.outShapeStridesLocation,new Int32Array(c));break;default:break}}t.outTexShapeLocation&&r.gl.uniform2i(t.outTexShapeLocation,o.texData.texShape[0],o.texData.texShape[1]),t.program.customUniforms&&n&&t.program.customUniforms.forEach((c,p)=>{let l=t.customUniformLocations[p],u=n[p];if(c.type==="float")r.gl.uniform1fv(l,u);else if(c.type==="vec2")r.gl.uniform2fv(l,u);else if(c.type==="vec3")r.gl.uniform3fv(l,u);else if(c.type==="vec4")r.gl.uniform4fv(l,u);else if(c.type==="int")r.gl.uniform1iv(l,u);else if(c.type==="ivec2")r.gl.uniform2iv(l,u);else if(c.type==="ivec3")r.gl.uniform3iv(l,u);else if(c.type==="ivec4")r.gl.uniform4iv(l,u);else throw Error(`uniform type ${c.type} is not supported yet.`)}),r.executeProgram()}function Sw(r,t,e){let o="";t.concat(e).forEach(a=>{let i=a.texData!=null&&a.texData.slice!=null&&a.texData.slice.flatOffset>0;if(r.enableShapeUniforms&&!a.isUniform){let c=a.texData.texShape,{useSqueezeShape:p,uniformShape:l,keptDims:u}=Hl(r.packedInputs,a.shape,c),m="",f="",d="";if(l.length===1&&r.packedInputs){let k=[Math.ceil(c[0]/2),Math.ceil(c[1]/2)];m=`${k[0]>1}_${k[1]>1}`}else if(l.length===2&&!r.packedInputs)f=`${l[0]>1}_${l[1]>1}`;else if(l.length>2&&!r.packedInputs){let k=y.computeStrides(l);d=`${k[0]===c[1]}_${k[k.length-1]===c[1]}`}let h=a.shape.length,g=l.length===2&&y.arraysEqual(a.shape,c),x=y.sizeFromShape(a.shape)===1,b=I.getBroadcastDims(a.shape,e.shape),S=!r.packedInputs&&h===e.shape.length&&y.arraysEqual(c,e.texData.texShape),N=r.packedInputs||l.length>2?"":`${c[0]>1}_${c[1]>1}`;o+=`${h}_${S}_${p?u:""}_${l.length}_${x}_${b}_${g}_${m}_${f}_${d}_${N}_${i}`}else{let c=a.isUniform?"uniform":a.texData.texShape;o+=`${a.shape}_${c}_${i}`}});let n=r.userCode,s=r.constructor.name;return s+="_"+o+"_"+n+`${F().getNumber("WEBGL_VERSION")}`,s}function $t(r){return F().getBool("WEBGL_USE_SHAPES_UNIFORMS")&&r<=4}var Kl=class{constructor(t){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.outPackingScheme=So.DENSE,this.customUniforms=[{name:"texShape",type:"ivec2"}];let e=Vt();this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length),this.userCode=`
      ivec3 outCoordsFromFlatIndex(int index) {
        ${this.enableShapeUniforms?Jn(["r","c","d"],t):fr(["r","c","d"],t)}
        return ivec3(r, c, d);
      }

      void main() {
        ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
        int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

        vec4 result = vec4(0.);

        for (int i=0; i<4; i++) {
          int flatIndex = index + i;
          ivec3 rc = outCoordsFromFlatIndex(flatIndex);
          result[i] = getA(rc.x, rc.y, rc.z);
        }

        ${e.output} = result;
      }
    `}};var ql=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outPackingScheme=So.DENSE,this.customUniforms=[{name:"texShape",type:"ivec2"}];let e=Vt();this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length),this.userCode=`
      ivec3 outCoordsFromFlatIndex(int index) {
        ${this.enableShapeUniforms?Jn(["r","c","d"],t):fr(["r","c","d"],t)}
        return ivec3(r, c, d);
      }

      void main() {
        ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
        int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

        vec4 result = vec4(0.);

        for (int i=0; i<4; i++) {
          int flatIndex = index + i;
          ivec3 rc = outCoordsFromFlatIndex(flatIndex);
          result[i] = getChannel(getA(rc.x, rc.y, rc.z), vec2(rc.y, rc.z));
        }

        ${e.output} = result;
      }
    `}};var Xl=class{constructor(t){this.variableNames=["A"],this.outTexUsage=ue.DOWNLOAD;let e=Vt();this.outputShape=t,this.userCode=`
      ${Ul}

      void main() {
        float x = getAAtOutCoords();
        ${e.output} = encode_float(x);
      }
    `}};var jl=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!1,this.outTexUsage=ue.DOWNLOAD;let e=Vt();this.outputShape=t,this.userCode=`
      ${Ul}

      void main() {
        ivec3 coords = getOutputCoords();
        float x = getChannel(getAAtOutCoords(), vec2(coords.y, coords.z));
        ${e.output} = encode_float(x);
      }
    `}};var Yl=class{constructor(t,e=!1){this.variableNames=["A"],this.customUniforms=[{name:"texShape",type:"ivec2"}];let o=Vt();this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length);let n="result";e&&(n="floor(result * 255. + 0.5)"),this.userCode=`
      ${this.enableShapeUniforms?gi():hi(t)}

      void main() {
        ivec3 coords = getOutputCoords();

        int flatIndex = getFlatIndex(coords);
        int offset = imod(flatIndex, 4);

        flatIndex = idiv(flatIndex, 4, 1.);

        int r = flatIndex / texShape[1];
        int c = imod(flatIndex, texShape[1]);
        vec2 uv = (vec2(c, r) + halfCR) / vec2(texShape[1], texShape[0]);
        vec4 values = ${o.texture2D}(A, uv);

        float result;

        if(offset == 0) {
          result = values[0];
        } else if(offset == 1) {
          result = values[1];
        } else if(offset == 2) {
          result = values[2];
        } else {
          result = values[3];
        }

        ${o.output} = vec4(${n}, 0., 0., 0.);
      }
    `}};var Zl=class{constructor(t,e=!1){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.customUniforms=[{name:"texShape",type:"ivec2"}];let o=Vt();this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length);let n="",s="result";e&&(s="floor(result * 255. + 0.5)");for(let a=0;a<=1;a++)for(let i=0;i<=1;i++){let c=a*2+i;n+=`
          localCoords = coords;
          if(localCoords[2] + ${i} < ${this.enableShapeUniforms?"outShape[2]":`${t[2]}`}) {
          localCoords[2] += ${i};
          if (localCoords[1] + ${a} < ${this.enableShapeUniforms?"outShape[1]":`${t[1]}`}) {
            localCoords[1] += ${a};

            flatIndex = getFlatIndex(localCoords);
            offset = imod(flatIndex, 4);

            flatIndex = idiv(flatIndex, 4, 1.);

            int r = flatIndex / texShape[1];
            int c = imod(flatIndex, texShape[1]);
            vec2 uv = (vec2(c, r) + halfCR) / vec2(texShape[1], texShape[0]);
            values = ${o.texture2D}(A, uv);

            if (offset == 0) {
              result[${c}] = values[0];
            } else if (offset == 1) {
              result[${c}] = values[1];
            } else if (offset == 2) {
              result[${c}] = values[2];
            } else {
              result[${c}] = values[3];
            }
          }
        }
        `}this.userCode=`
        ${this.enableShapeUniforms?gi():hi(t)}

        void main() {
          ivec3 coords = getOutputCoords();

          vec4 result = vec4(0.);
          int flatIndex, r, c, offset;
          ivec3 localCoords;
          vec2 uv;
          vec4 values;

          ${n}

          ${o.output} = ${s};
        }
    `}};function ww(r){let t=Vt(),e=`${t.version}
    precision highp float;
    ${t.attribute} vec3 clipSpacePos;
    ${t.attribute} vec2 uv;
    ${t.varyingVs} vec2 resultUV;

    void main() {
      gl_Position = vec4(clipSpacePos, 1);
      resultUV = uv;
    }`;return jS(r,e)}function Nw(r){let t=new Float32Array([-1,1,0,0,1,-1,-1,0,0,0,1,1,0,1,1,1,-1,0,1,0]);return JS(r,t)}function Iw(r){let t=new Uint16Array([0,1,2,2,1,3]);return tw(r,t)}function Ic(r,t,e,o,n,s){rw(t,e);let a=ew(r),i=r.TEXTURE_2D;return ot(r,()=>r.bindTexture(i,a)),ot(r,()=>r.texParameteri(i,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE)),ot(r,()=>r.texParameteri(i,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE)),ot(r,()=>r.texParameteri(i,r.TEXTURE_MIN_FILTER,r.NEAREST)),ot(r,()=>r.texParameteri(i,r.TEXTURE_MAG_FILTER,r.NEAREST)),F().getNumber("WEBGL_VERSION")===1?ot(r,()=>r.texImage2D(i,0,o,t,e,0,n,s,null)):ot(r,()=>r.texStorage2D(i,1,o,t,e)),ot(r,()=>r.bindTexture(r.TEXTURE_2D,null)),{texture:a,texShape:[e,t]}}function Jd(r){return r.internalFormatFloat}function vw(r,t,e,o){let[n,s]=Zn(t,e);return Ic(r,n,s,Jd(o),o.textureFormatFloat,r.FLOAT)}function th(r){return r.internalFormatHalfFloat}function kw(r,t,e,o){let[n,s]=Zn(t,e);return Ic(r,n,s,th(o),o.textureFormatFloat,o.textureTypeHalfFloat)}function eh(r){return r.downloadTextureFormat}function Ew(r,t,e,o){let[n,s]=Zn(t,e);return Ic(r,n,s,eh(o),r.RGBA,r.UNSIGNED_BYTE)}function rh(r){return r.internalFormatPackedFloat}function $w(r,t,e,o){let[n,s]=Rr(t,e);return Ic(r,n,s,rh(o),r.RGBA,r.FLOAT)}function oh(r){return r.internalFormatPackedHalfFloat}function Rw(r,t,e,o){let[n,s]=Rr(t,e);return Ic(r,n,s,oh(o),r.RGBA,o.textureTypeHalfFloat)}function Aw(r,t,e){return ot(r,()=>r.bindBuffer(r.ARRAY_BUFFER,e)),jd(r,t,"clipSpacePos",e,3,20,0)&&jd(r,t,"uv",e,2,20,12)}function Fw(r,t,e,o,n,s){ot(r,()=>r.bindTexture(r.TEXTURE_2D,t));let a,i,c;n instanceof Uint8Array?(a=new Uint8Array(e*o*4),i=r.UNSIGNED_BYTE,c=r.RGBA):(a=new Float32Array(e*o*4),i=r.FLOAT,c=s.internalFormatPackedFloat),a.set(n),F().getNumber("WEBGL_VERSION")===2?ot(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,e,o,r.RGBA,i,a)):ot(r,()=>r.texImage2D(r.TEXTURE_2D,0,c,e,o,0,r.RGBA,i,a)),ot(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function Dw(r,t,e){ot(r,()=>r.bindTexture(r.TEXTURE_2D,t)),e.data instanceof Uint8Array?F().getNumber("WEBGL_VERSION")===2?ot(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,e.width,e.height,r.RGBA,r.UNSIGNED_BYTE,e.data)):ot(r,()=>r.texImage2D(r.TEXTURE_2D,0,r.RGBA,e.width,e.height,0,r.RGBA,r.UNSIGNED_BYTE,e.data)):F().getNumber("WEBGL_VERSION")===2?ot(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,r.RGBA,r.UNSIGNED_BYTE,e)):ot(r,()=>r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,e)),ot(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function _w(r,t,e,o){let n=r.createBuffer();ot(r,()=>r.bindBuffer(r.PIXEL_PACK_BUFFER,n));let i=4*4*t*e;return ot(r,()=>r.bufferData(r.PIXEL_PACK_BUFFER,i,r.STREAM_READ)),ot(r,()=>r.readPixels(0,0,e,t,r.RGBA,r.FLOAT,0)),ot(r,()=>r.bindBuffer(r.PIXEL_PACK_BUFFER,null)),n}function Ow(r,t,e){let o=r,n=new Float32Array(e);return o.bindBuffer(o.PIXEL_PACK_BUFFER,t),o.getBufferSubData(o.PIXEL_PACK_BUFFER,0,n),o.bindBuffer(o.PIXEL_PACK_BUFFER,null),n}function Pw(r,t,e,o){let[n,s]=Zn(t,e),a=4,i=new Uint8Array(KS(t*e,a));return ot(r,()=>r.readPixels(0,0,n,s,o.downloadTextureFormat,r.UNSIGNED_BYTE,i)),new Float32Array(i.buffer)}function Lw(r,t,e,o,n,s,a,i){let c=r,p=new Float32Array(qS(s,a));return c.bindBuffer(c.PIXEL_PACK_BUFFER,t),c.getBufferSubData(c.PIXEL_PACK_BUFFER,0,p),c.bindBuffer(c.PIXEL_PACK_BUFFER,null),p}function Bw(r,t,e){let o=new Float32Array(t*e*4);return ot(r,()=>r.readPixels(0,0,e,t,r.RGBA,r.FLOAT,o)),o}var Si=class{constructor(t){this.outputTexture=null,this.program=null,this.disposed=!1,this.vertexAttrsAreBound=!1,this.itemsToPoll=[];let e=F().getNumber("WEBGL_VERSION");t!=null?(this.gl=t,HS(e,t)):this.gl=Fe(e);let o="WEBGL_color_buffer_float",n="EXT_color_buffer_half_float";if(this.parallelCompilationExtension=this.gl.getExtension("KHR_parallel_shader_compile"),F().getNumber("WEBGL_VERSION")===1){let s="OES_texture_float",a="OES_texture_half_float";if(this.textureFloatExtension=wc(this.gl,s),Me(this.gl,a))this.textureHalfFloatExtension=wc(this.gl,a);else if(F().get("WEBGL_FORCE_F16_TEXTURES"))throw new Error("GL context does not support half float textures, yet the environment flag WEBGL_FORCE_F16_TEXTURES is set to true.");if(this.colorBufferFloatExtension=this.gl.getExtension(o),Me(this.gl,n))this.colorBufferHalfFloatExtension=wc(this.gl,n);else if(F().get("WEBGL_FORCE_F16_TEXTURES"))throw new Error("GL context does not support color renderable half floats, yet the environment flag WEBGL_FORCE_F16_TEXTURES is set to true.")}else if(o="EXT_color_buffer_float",Me(this.gl,o))this.colorBufferFloatExtension=this.gl.getExtension(o);else if(Me(this.gl,n))this.colorBufferHalfFloatExtension=this.gl.getExtension(n);else throw new Error("GL context does not support color renderable floats");this.vertexBuffer=Nw(this.gl),this.indexBuffer=Iw(this.gl),this.framebuffer=ow(this.gl),this.textureConfig=Sc(this.gl,this.textureHalfFloatExtension)}get debug(){return F().getBool("DEBUG")}dispose(){if(this.disposed)return;this.program!=null&&console.warn("Disposing a GPGPUContext that still has a bound WebGLProgram. This is probably a resource leak, delete the program with GPGPUContext.deleteProgram before disposing."),this.outputTexture!=null&&console.warn("Disposing a GPGPUContext that still has a bound output matrix texture.  This is probably a resource leak, delete the output matrix texture with GPGPUContext.deleteMatrixTexture before disposing.");let t=this.gl;ot(t,()=>t.finish()),ot(t,()=>t.bindFramebuffer(t.FRAMEBUFFER,null)),ot(t,()=>t.deleteFramebuffer(this.framebuffer)),ot(t,()=>t.bindBuffer(t.ARRAY_BUFFER,null)),ot(t,()=>t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,null)),ot(t,()=>t.deleteBuffer(this.indexBuffer)),this.disposed=!0}createFloat32MatrixTexture(t,e){return this.throwIfDisposed(),vw(this.gl,t,e,this.textureConfig)}createFloat16MatrixTexture(t,e){return this.throwIfDisposed(),kw(this.gl,t,e,this.textureConfig)}createUnsignedBytesMatrixTexture(t,e){return this.throwIfDisposed(),Ew(this.gl,t,e,this.textureConfig)}uploadPixelDataToTexture(t,e){this.throwIfDisposed(),Dw(this.gl,t,e)}uploadDenseMatrixToTexture(t,e,o,n){this.throwIfDisposed(),Fw(this.gl,t,e,o,n,this.textureConfig)}createFloat16PackedMatrixTexture(t,e){return this.throwIfDisposed(),Rw(this.gl,t,e,this.textureConfig)}createPackedMatrixTexture(t,e){return this.throwIfDisposed(),$w(this.gl,t,e,this.textureConfig)}deleteMatrixTexture(t){this.throwIfDisposed(),this.outputTexture===t&&(Yd(this.gl,this.framebuffer),this.outputTexture=null),ot(this.gl,()=>this.gl.deleteTexture(t))}downloadByteEncodedFloatMatrixFromOutputTexture(t,e,o){return this.downloadMatrixDriver(t,()=>Pw(this.gl,e,o,this.textureConfig))}downloadPackedMatrixFromBuffer(t,e,o,n,s,a){return Lw(this.gl,t,e,o,n,s,a,this.textureConfig)}downloadFloat32MatrixFromBuffer(t,e){return Ow(this.gl,t,e)}createBufferFromTexture(t,e,o){this.bindTextureToFrameBuffer(t);let n=_w(this.gl,e,o,this.textureConfig);return this.unbindTextureToFrameBuffer(),n}createAndWaitForFence(){let t=this.createFence(this.gl);return this.pollFence(t)}createFence(t){let e,o;if(F().getBool("WEBGL_FENCE_API_ENABLED")){let n=t,s=n.fenceSync(n.SYNC_GPU_COMMANDS_COMPLETE,0);t.flush(),o=()=>{let a=n.clientWaitSync(s,0,0);return a===n.ALREADY_SIGNALED||a===n.CONDITION_SATISFIED},e=s}else F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")>0?(e=this.beginQuery(),this.endQuery(),o=()=>this.isQueryAvailable(e,F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))):o=()=>!0;return{query:e,isFencePassed:o}}downloadMatrixFromPackedTexture(t,e,o){return this.downloadMatrixDriver(t,()=>Bw(this.gl,e,o))}createProgram(t){this.throwIfDisposed();let e=this.gl;this.vertexShader==null&&(this.vertexShader=ww(e));let o=ZS(e);return ot(e,()=>e.attachShader(o,this.vertexShader)),ot(e,()=>e.attachShader(o,t)),QS(e,o),this.debug&&Ml(e,o),this.vertexAttrsAreBound||(this.setProgram(o),this.vertexAttrsAreBound=Aw(e,this.program,this.vertexBuffer)),o}deleteProgram(t){this.throwIfDisposed(),t===this.program&&(this.program=null),t!=null&&ot(this.gl,()=>this.gl.deleteProgram(t))}setProgram(t){this.throwIfDisposed(),this.program=t,this.program!=null&&this.debug&&Ml(this.gl,this.program),ot(this.gl,()=>this.gl.useProgram(t))}getUniformLocation(t,e,o=!0){return this.throwIfDisposed(),o?nw(this.gl,t,e):sw(this.gl,t,e)}getAttributeLocation(t,e){return this.throwIfDisposed(),ot(this.gl,()=>this.gl.getAttribLocation(t,e))}getUniformLocationNoThrow(t,e){return this.throwIfDisposed(),this.gl.getUniformLocation(t,e)}setInputMatrixTexture(t,e,o){this.throwIfDisposed(),this.throwIfNoProgram(),aw(this.gl,t,e,o)}setOutputMatrixTexture(t,e,o){this.setOutputMatrixTextureDriver(t,o,e)}setOutputPackedMatrixTexture(t,e,o){this.throwIfDisposed();let[n,s]=Rr(e,o);this.setOutputMatrixTextureDriver(t,n,s)}setOutputMatrixWriteRegion(t,e,o,n){this.setOutputMatrixWriteRegionDriver(o,t,n,e)}setOutputPackedMatrixWriteRegion(t,e,o,n){throw new Error("setOutputPackedMatrixWriteRegion not implemented.")}debugValidate(){this.program!=null&&Ml(this.gl,this.program),Nc(this.gl)}executeProgram(){this.throwIfDisposed(),this.throwIfNoProgram();let t=this.gl;this.debug&&this.debugValidate(),ot(t,()=>t.drawElements(t.TRIANGLES,6,t.UNSIGNED_SHORT,0))}blockUntilAllProgramsCompleted(){this.throwIfDisposed(),ot(this.gl,()=>this.gl.finish())}getQueryTimerExtension(){return this.disjointQueryTimerExtension==null&&(this.disjointQueryTimerExtension=wc(this.gl,F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2?"EXT_disjoint_timer_query_webgl2":"EXT_disjoint_timer_query")),this.disjointQueryTimerExtension}getQueryTimerExtensionWebGL2(){return this.getQueryTimerExtension()}getQueryTimerExtensionWebGL1(){return this.getQueryTimerExtension()}beginQuery(){if(F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2){let o=this.gl,n=this.getQueryTimerExtensionWebGL2(),s=o.createQuery();return o.beginQuery(n.TIME_ELAPSED_EXT,s),s}let t=this.getQueryTimerExtensionWebGL1(),e=t.createQueryEXT();return t.beginQueryEXT(t.TIME_ELAPSED_EXT,e),e}endQuery(){if(F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2){let e=this.gl,o=this.getQueryTimerExtensionWebGL2();e.endQuery(o.TIME_ELAPSED_EXT);return}let t=this.getQueryTimerExtensionWebGL1();t.endQueryEXT(t.TIME_ELAPSED_EXT)}async waitForQueryAndGetTime(t){return await y.repeatedTry(()=>this.disposed||this.isQueryAvailable(t,F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))),this.getQueryTime(t,F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))}getQueryTime(t,e){if(e===0)return null;if(e===2){let o=this.gl;return o.getQueryParameter(t,o.QUERY_RESULT)/1e6}else{let o=this.getQueryTimerExtensionWebGL1();return o.getQueryObjectEXT(t,o.QUERY_RESULT_EXT)/1e6}}isQueryAvailable(t,e){if(e===0)return!0;if(e===2){let o=this.gl,n=this.getQueryTimerExtensionWebGL2(),s=o.getQueryParameter(t,o.QUERY_RESULT_AVAILABLE);return this.disjoint==null&&(this.disjoint=this.gl.getParameter(n.GPU_DISJOINT_EXT)),s&&!this.disjoint}else{let o=this.getQueryTimerExtensionWebGL1(),n=o.getQueryObjectEXT(t,o.QUERY_RESULT_AVAILABLE_EXT);return this.disjoint==null&&(this.disjoint=this.gl.getParameter(o.GPU_DISJOINT_EXT)),n&&!this.disjoint}}pollFence(t){return new Promise(e=>{this.addItemToPoll(()=>t.isFencePassed(),()=>e())})}pollItems(){let t=L3(this.itemsToPoll.map(e=>e.isDoneFn));for(let e=0;e<=t;++e){let{resolveFn:o}=this.itemsToPoll[e];o()}this.itemsToPoll=this.itemsToPoll.slice(t+1)}addItemToPoll(t,e){if(this.itemsToPoll.push({isDoneFn:t,resolveFn:e}),this.itemsToPoll.length>1)return;let o;"setTimeoutCustom"in F().platform&&(o=F().platform.setTimeoutCustom.bind(F().platform)),y.repeatedTry(()=>(this.pollItems(),this.itemsToPoll.length===0),()=>0,null,o)}bindTextureToFrameBuffer(t){this.throwIfDisposed(),zl(this.gl,t,this.framebuffer),this.debug&&Nc(this.gl)}unbindTextureToFrameBuffer(){this.outputTexture!=null?(zl(this.gl,this.outputTexture,this.framebuffer),this.debug&&Nc(this.gl)):Yd(this.gl,this.framebuffer)}downloadMatrixDriver(t,e){this.bindTextureToFrameBuffer(t);let o=e();return this.unbindTextureToFrameBuffer(),o}setOutputMatrixTextureDriver(t,e,o){this.throwIfDisposed();let n=this.gl;zl(n,t,this.framebuffer),this.debug&&Nc(n),this.outputTexture=t,ot(n,()=>n.viewport(0,0,e,o)),ot(n,()=>n.scissor(0,0,e,o))}setOutputMatrixWriteRegionDriver(t,e,o,n){this.throwIfDisposed(),ot(this.gl,()=>this.gl.scissor(t,e,o,n))}throwIfDisposed(){if(this.disposed)throw new Error("Attempted to use disposed GPGPUContext.")}throwIfNoProgram(){if(this.program==null)throw new Error("No GPU program is currently set.")}};function L3(r){let t=0;for(;t<r.length&&r[t]();++t);return t-1}var{addImpl:Vw,bincountImpl:Ql,bincountReduceImpl:Mw,castImpl:zw,ceilImpl:Ww,concatImpl:Gw,equalImpl:Uw,expImpl:Hw,expm1Impl:Kw,floorImpl:qw,gatherNdImpl:Xw,gatherV2Impl:jw,greaterImpl:Yw,greaterEqualImpl:Zw,lessImpl:Qw,lessEqualImpl:Jw,linSpaceImpl:tN,logImpl:eN,maxImpl:rN,maximumImpl:oN,minimumImpl:nN,multiplyImpl:sN,negImpl:aN,notEqualImpl:iN,prodImpl:cN,raggedGatherImpl:pN,raggedTensorToTensorImpl:lN,rangeImpl:uN,rsqrtImpl:mN,scatterImpl:fN,sigmoidImpl:dN,simpleAbsImpl:Jl,sliceImpl:hN,sparseFillEmptyRowsImpl:gN,sparseReshapeImpl:xN,sparseSegmentReductionImpl:tu,sqrtImpl:yN,stridedSliceImpl:bN,stringNGramsImpl:CN,stringSplitImpl:TN,stringToHashBucketFastImpl:SN,subImpl:wN,tileImpl:NN,topKImpl:IN,transposeImpl:es,uniqueImpl:vN}=Ad;function nh(r,t){return["x","y","z","w","u","v"].slice(0,t).map(e=>`${r}.${e}`)}function Ht(r,t){return t===1?[r]:nh(r,t)}function kN(r,t){if(r===1)return"rc";let e="";for(let o=0;o<r;o++)e+=t[o],o<r-1&&(e+=",");return e}var eu=class{constructor(t){if(this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.outputShape=t,this.rank=t.length,this.enableShapeUniforms=$t(this.outputShape.length),this.rank===0)this.userCode=`
        void main() {
          setOutput(vec4(getA(), 0., 0., 0.));
        }
      `;else{let e=Ht("rc",this.rank),o=mt(this.rank),n=this.getOutOfBoundsCondition(e),s=this.getSetup(e),a=this.getOutput(e);this.userCode=`
        void main() {
          ${o} rc = getOutputCoords();

          if(${n}) {
            setOutput(vec4(0));
          } else {
            ${s}

            setOutput(vec4(${a}));
          }
        }
      `}}getSourceCoordsArr(t){let e=[];for(let o=0;o<=1;o++)for(let n=0;n<=1;n++){let s=`${o===0?"r":"rp1"}, ${n===0?"c":"cp1"}`;for(let a=2;a<this.rank;a++)s=`${t[t.length-1-a]},`+s;e.push(s)}return e}getOutOfBoundsCondition(t){if(this.rank===1)return`rc > ${this.enableShapeUniforms?"outShape":this.outputShape[0]}`;let e="";for(let o=this.rank-2;o<this.rank;o++)e+=`${t[o]} >= ${this.enableShapeUniforms?`outShape[${o}]`:this.outputShape[o]}`,o<this.rank-1&&(e+="||");return e}getSetup(t){if(this.rank===1)return"";let e=t.slice(-2),o=this.enableShapeUniforms?`outShape[${this.rank} - 1]`:this.outputShape[this.rank-1],n=this.enableShapeUniforms?`outShape[${this.rank} - 2]`:this.outputShape[this.rank-2];return`
      int r = ${e[0]};
      int c = ${e[1]};
      int rp1 = r + 1;
      int cp1 = c + 1;

      bool cEdge = cp1 >= ${o};
      bool rEdge = rp1 >= ${n};
    `}getOutput(t){let e=this.getSourceCoordsArr(t);return this.rank===1?`getA(rc), (rc + 1 >= ${this.enableShapeUniforms?"outShape":this.outputShape[0]} ? 0. : getA(rc + 1)), 0, 0`:`getA(${e[0]}),
            cEdge ? 0. : getA(${e[1]}),
            rEdge ? 0. : getA(${e[2]}),
            rEdge || cEdge ? 0. : getA(${e[3]})`}};var wi=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"inputShape",type:"ivec3"}],this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length);let o="";for(let n=0;n<4;n++){let s="thisRC = rc;";n%2===1&&(s+="thisRC.z += 1;"),n>1&&(s+="thisRC.y += 1;"),o+=`
        ${s}
        ${n>0?"if(thisRC.y < rows && thisRC.z < cols){":""}
          int flatIndex = getFlatIndex(thisRC);

          ivec3 inputRC = inputCoordsFromReshapedOutCoords(flatIndex);
          vec2 inputRCInnerDims = vec2(float(inputRC.y),float(inputRC.z));

          result[${n}] =
            getChannel(getA(inputRC.x, inputRC.y, inputRC.z), inputRCInnerDims);
        ${n>0?"}":""}
      `}this.userCode=`
      ${B3(e,this.enableShapeUniforms)}
      ${this.enableShapeUniforms?gi():hi(t)}

      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0.);

        ivec3 thisRC;
        int rows = ${this.enableShapeUniforms?"outShape[1]":t[1]};
        int cols = ${this.enableShapeUniforms?"outShape[2]":t[2]};

        ${o}

        setOutput(result);
      }
    `}};function B3(r,t){return`
    ivec3 inputCoordsFromReshapedOutCoords(int index) {
      ${t?dw(["r","c","d"],"inputShape"):fr(["r","c","d"],r)}
      return ivec3(r, c, d);
    }
  `}var ru=class{constructor(t){this.gpgpu=t,this.numUsedTextures=0,this.numFreeTextures=0,this._numBytesAllocated=0,this._numBytesFree=0,this.freeTextures={},this.logEnabled=!1,this.usedTextures={}}acquireTexture(t,e,o){let n=$N(e,o),s=RN(t,n,o);s in this.freeTextures||(this.freeTextures[s]=[]),s in this.usedTextures||(this.usedTextures[s]=[]);let a=EN(t,n,this.gpgpu.gl,this.gpgpu.textureConfig,o);if(this.freeTextures[s].length>0){this.numFreeTextures--,this.numUsedTextures++,this._numBytesFree-=a,this.log();let c=this.freeTextures[s].shift();return this.usedTextures[s].push(c),c}let i;return n===ae.PACKED_2X2_FLOAT32?i=this.gpgpu.createPackedMatrixTexture(t[0],t[1]):n===ae.PACKED_2X2_FLOAT16?i=this.gpgpu.createFloat16PackedMatrixTexture(t[0],t[1]):n===ae.UNPACKED_FLOAT32?i=this.gpgpu.createFloat32MatrixTexture(t[0],t[1]):n===ae.UNPACKED_FLOAT16?i=this.gpgpu.createFloat16MatrixTexture(t[0],t[1]):n===ae.PACKED_4X1_UNSIGNED_BYTE&&(i=this.gpgpu.createUnsignedBytesMatrixTexture(t[0],t[1])),this.usedTextures[s].push(i),this.numUsedTextures++,this._numBytesAllocated+=a,this.log(),i}releaseTexture(t,e,o,n){if(this.freeTextures==null)return;let s=$N(o,n),a=RN(e,s,n);a in this.freeTextures||(this.freeTextures[a]=[]);let i=EN(e,s,this.gpgpu.gl,this.gpgpu.textureConfig,n),c=F().get("WEBGL_DELETE_TEXTURE_THRESHOLD");c!==-1&&this._numBytesAllocated>c?(this.gpgpu.deleteMatrixTexture(t.texture),this._numBytesAllocated-=i):(this.freeTextures[a].push(t),this.numFreeTextures++,this._numBytesFree+=i),this.numUsedTextures--;let p=this.usedTextures[a],l=p.indexOf(t);if(l<0)throw new Error("Cannot release a texture that was never provided by this texture manager");p.splice(l,1),this.log()}log(){if(!this.logEnabled)return;let t=this.numFreeTextures+this.numUsedTextures;console.log("Free/Used",`${this.numFreeTextures} / ${this.numUsedTextures}`,`(${t})`);let e=this._numBytesFree/this._numBytesAllocated;console.log(`Bytes allocated: ${this._numBytesAllocated}`),console.log(`Bytes unused: ${this._numBytesFree} (${Math.round(100*e)}%)`)}get numBytesAllocated(){return this._numBytesAllocated}get numBytesFree(){return this._numBytesFree}getNumUsedTextures(){return this.numUsedTextures}getNumFreeTextures(){return this.numFreeTextures}dispose(){if(this.freeTextures!=null){for(let t in this.freeTextures)this.freeTextures[t].forEach(e=>{this.gpgpu.deleteMatrixTexture(e.texture)});for(let t in this.usedTextures)this.usedTextures[t].forEach(e=>{this.gpgpu.deleteMatrixTexture(e.texture)});this.freeTextures=null,this.usedTextures=null,this.numUsedTextures=0,this.numFreeTextures=0,this._numBytesAllocated=0,this._numBytesFree=0}}};function V3(r,t){let e=r;if(t===e.R32F)return 4;if(t===e.R16F)return 2;if(t===e.RGBA32F)return 16;if(t===r.RGBA)return 16;if(t===e.RGBA16F)return 8;if(t===e.RGBA8)return 4;throw new Error(`Unknown internal format ${t}`)}function EN(r,t,e,o,n){let s=M3(t,o),a;if(n){let[c,p]=Rr(r[0],r[1]);a=c*p}else{let[c,p]=Zn(r[0],r[1]);a=c*p}let i=V3(e,s);return a*i}function M3(r,t){switch(r){case ae.PACKED_2X2_FLOAT32:return rh(t);case ae.PACKED_2X2_FLOAT16:return oh(t);case ae.UNPACKED_FLOAT32:return Jd(t);case ae.UNPACKED_FLOAT16:return th(t);case ae.PACKED_4X1_UNSIGNED_BYTE:return eh(t);default:throw new Error(`Unknown physical texture type ${r}`)}}function z3(r){return F().getBool("WEBGL_RENDER_FLOAT32_ENABLED")?r?ae.PACKED_2X2_FLOAT32:ae.UNPACKED_FLOAT32:r?ae.PACKED_2X2_FLOAT16:ae.UNPACKED_FLOAT16}function $N(r,t){if(r===ue.UPLOAD)return ae.PACKED_2X2_FLOAT32;if(r===ue.RENDER||r==null)return z3(t);if(r===ue.DOWNLOAD||r===ue.PIXELS)return ae.PACKED_4X1_UNSIGNED_BYTE;throw new Error(`Unknown logical texture type ${r}`)}function RN(r,t,e){return`${r[0]}_${r[1]}_${t}_${e}`}var ge=class{constructor(t,e){this.variableNames=["A"],this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length),this.userCode=`
      float unaryOperation(float x) {
        ${e}
      }

      void main() {
        float x = getAAtOutCoords();
        float y = unaryOperation(x);

        setOutput(y);
      }
    `}},te="if (isnan(x)) return x;",AN="return x;",sh="return abs(x);";var FN="return (x >= 0.0) ? x : (exp(x) - 1.0);",DN=te+`
  return (x < 0.0) ? 0.0 : x;
`,_N=te+`
  return (x < 0.0) ? 0.0 : min(6.0, x);
`,rs="return x;",ON="return 1.0 / (1.0 + exp(-1.0 * x));";var LN="return x;",BN=`
  vec4 result;

  result.r = (x.r >= 0.0) ? x.r : (exp(x.r) - 1.0);
  result.g = (x.g >= 0.0) ? x.g : (exp(x.g) - 1.0);
  result.b = (x.b >= 0.0) ? x.b : (exp(x.b) - 1.0);
  result.a = (x.a >= 0.0) ? x.a : (exp(x.a) - 1.0);

  return result;
`,VN=`
  vec4 result = x * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,MN=`
  vec4 result = min(x, vec4(6.)) * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,zN="return 1.0 / (1.0 + exp(-1.0 * x));",ze=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length),this.userCode=`
      vec4 unaryOperation(vec4 x) {
        ${e}
      }

      void main() {
        vec4 x = getAAtOutCoords();
        vec4 y = unaryOperation(x);

        setOutput(y);
      }
    `}};var ou=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!1,this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length);let e=t.length,o=Ht("rc",e),n=mt(e),s=kN(e,o),a=o.slice(-2),i=e<=1?"rc":`vec2(${a.join(",")})`;this.userCode=`
      void main() {
        ${n} rc = getOutputCoords();
        vec4 packedInput = getA(${s});

        setOutput(getChannel(packedInput, ${i}));
      }
    `}};var G3=pe.whereImpl,U3=1e-7,H3=1e-4,nu={};function K3(r){return r in nu||(nu[r]={}),nu[r]}var q3=F().getNumber("CPU_HANDOFF_SIZE_THRESHOLD"),X3=600;function j3(){return F().global.screen==null?1024:F().global.screen.height*F().global.screen.width*window.devicePixelRatio*X3/1024/1024}var vc=class r extends Or{constructor(t){if(super(),this.pendingRead=new WeakMap,this.pendingDisposal=new WeakSet,this.dataRefCount=new WeakMap,this.numBytesInGPU=0,this.uploadWaitMs=0,this.downloadWaitMs=0,this.lastGlFlushTime=0,this.warnedAboutMemory=!1,this.pendingDeletes=0,this.disposed=!1,!F().getBool("HAS_WEBGL"))throw new Error("WebGL is not supported on this device");let e;if(t!=null){if(t instanceof Si)e=t;else{let o=Fe(F().getNumber("WEBGL_VERSION"),t);e=new Si(o)}this.binaryCache={},this.gpgpuCreatedLocally=!1}else{let o=Fe(F().getNumber("WEBGL_VERSION"));e=new Si(o),this.binaryCache=K3(F().getNumber("WEBGL_VERSION")),this.gpgpuCreatedLocally=!0}this.gpgpu=e,this.canvas=this.gpgpu.gl.canvas,this.textureManager=new ru(this.gpgpu),this.numMBBeforeWarning=j3(),this.texData=new Eo(this,lr())}nextDataId(){return r.nextDataId++}numDataIds(){return this.texData.numDataIds()-this.pendingDeletes}write(t,e,o){if((F().getBool("WEBGL_CHECK_NUMERICAL_PROBLEMS")||F().getBool("DEBUG"))&&this.checkNumericalProblems(t),o==="complex64"&&t!=null)throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");let n={id:this.nextDataId()};return this.texData.set(n,{shape:e,dtype:o,values:t,usage:ue.UPLOAD,refCount:1}),n}refCount(t){return this.texData.has(t)?this.texData.get(t).refCount:0}incRef(t){let e=this.texData.get(t);e.refCount++}decRef(t){if(this.texData.has(t)){let e=this.texData.get(t);e.refCount--}}move(t,e,o,n,s){if(F().getBool("DEBUG")&&this.checkNumericalProblems(e),n==="complex64")throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");this.texData.set(t,{shape:o,dtype:n,values:e,usage:ue.UPLOAD,refCount:s})}disposeIntermediateTensorInfo(t){this.disposeData(t.dataId)}readSync(t){let e=this.texData.get(t),{values:o,dtype:n,complexTensorInfos:s,slice:a,shape:i,isPacked:c}=e;if(a!=null){let m;c?m=new ze(i,rs):m=new ge(i,rs);let f=this.runWebGLProgram(m,[{dataId:t,shape:i,dtype:n}],n),d=this.readSync(f.dataId);return this.disposeIntermediateTensorInfo(f),d}if(o!=null)return this.convertAndCacheOnCPU(t);if(n==="string")return o;let p=this.activeTimers!=null,l;p&&(l=y.now());let u;if(n==="complex64"){let m=this.readSync(s.real.dataId),f=this.readSync(s.imag.dataId);u=I.mergeRealAndImagArrays(m,f)}else u=this.getValuesFromTexture(t);return p&&(this.downloadWaitMs+=y.now()-l),this.convertAndCacheOnCPU(t,u)}async read(t){if(this.pendingRead.has(t)){let d=this.pendingRead.get(t);return new Promise(h=>d.push(h))}let e=this.texData.get(t),{values:o,shape:n,slice:s,dtype:a,complexTensorInfos:i,isPacked:c}=e;if(s!=null){let d;c?d=new ze(n,rs):d=new ge(n,rs);let h=this.runWebGLProgram(d,[{dataId:t,shape:n,dtype:a}],a),g=this.read(h.dataId);return this.disposeIntermediateTensorInfo(h),g}if(o!=null)return this.convertAndCacheOnCPU(t);if(F().getBool("DEBUG")&&!F().getBool("WEBGL_DOWNLOAD_FLOAT_ENABLED")&&F().getNumber("WEBGL_VERSION")===2)throw new Error("tensor.data() with WEBGL_DOWNLOAD_FLOAT_ENABLED=false and WEBGL_VERSION=2 not yet supported.");let p=null,l;if(a!=="complex64"&&F().get("WEBGL_BUFFER_SUPPORTED")){l=this.decode(t);let d=this.texData.get(l.dataId);p=this.gpgpu.createBufferFromTexture(d.texture.texture,...Tc(n))}this.pendingRead.set(t,[]),a!=="complex64"&&await this.gpgpu.createAndWaitForFence();let u;if(a==="complex64"){let d=await Promise.all([this.read(i.real.dataId),this.read(i.imag.dataId)]),h=d[0],g=d[1];u=I.mergeRealAndImagArrays(h,g)}else if(p==null)u=this.getValuesFromTexture(t);else{let d=y.sizeFromShape(n);u=this.gpgpu.downloadFloat32MatrixFromBuffer(p,d)}if(l!=null&&this.disposeIntermediateTensorInfo(l),p!=null){let d=this.gpgpu.gl;ot(d,()=>d.deleteBuffer(p))}let m=this.convertAndCacheOnCPU(t,u),f=this.pendingRead.get(t);return this.pendingRead.delete(t),f.forEach(d=>d(m)),this.pendingDisposal.has(t)&&(this.pendingDisposal.delete(t),this.disposeData(t)&&lr().removeDataId(t,this),this.pendingDeletes--),m}readToGPU(t,e={}){let o=this.texData.get(t),{values:n,shape:s,slice:a,dtype:i,isPacked:c,texture:p}=o;if(i==="complex64")throw new Error("Does not support reading texture for complex64 dtype.");if(a!=null){let f;c?f=new ze(s,rs):f=new ge(s,rs);let d=this.runWebGLProgram(f,[{dataId:t,shape:s,dtype:i}],i),h=this.readToGPU(d,e);return this.disposeIntermediateTensorInfo(d),h}if(p==null)throw n!=null?new Error("Data is not on GPU but on CPU."):new Error("There is no data on GPU or CPU.");let l=this.decode(t,e.customTexShape),u=lr().makeTensorFromTensorInfo(l),m=this.texData.get(l.dataId);return Object.assign({tensorRef:u},m.texture)}bufferSync(t){let e=this.readSync(t.dataId);if(t.dtype==="string")try{let o=e.map(n=>y.decodeString(n));return tt(t.shape,t.dtype,o)}catch{throw new Error("Failed to decode encoded string bytes into utf-8")}return tt(t.shape,t.dtype,e)}checkNumericalProblems(t){if(t!=null)for(let e=0;e<t.length;e++){let o=t[e];if(!XS(o))throw F().getBool("WEBGL_RENDER_FLOAT32_CAPABLE")?Error(`The value ${o} cannot be represented with your current settings. Consider enabling float32 rendering: 'tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);'`):Error(`The value ${o} cannot be represented on this device.`)}}getValuesFromTexture(t){let{shape:e,dtype:o,isPacked:n}=this.texData.get(t),s=y.sizeFromShape(e);if(F().getBool("WEBGL_DOWNLOAD_FLOAT_ENABLED")){let m=this.decode(t),f=this.texData.get(m.dataId),d=this.gpgpu.downloadMatrixFromPackedTexture(f.texture.texture,...Tc(e)).subarray(0,s);return this.disposeIntermediateTensorInfo(m),d}let a=F().getBool("WEBGL_PACK")&&n===!0,i=a?Wl(e):e,c=a?new jl(i):new Xl(i),p=this.runWebGLProgram(c,[{shape:i,dtype:o,dataId:t}],"float32"),l=this.texData.get(p.dataId),u=this.gpgpu.downloadByteEncodedFloatMatrixFromOutputTexture(l.texture.texture,l.texShape[0],l.texShape[1]).subarray(0,s);return this.disposeIntermediateTensorInfo(p),u}timerAvailable(){return F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0}time(t){let e=this.activeTimers,o=[],n=!1;this.programTimersStack==null?(this.programTimersStack=o,n=!0):this.activeTimers.push(o),this.activeTimers=o,t();let s=y.flatten(this.activeTimers.map(c=>c.query)).filter(c=>c!=null),a=y.flatten(this.activeTimers.map(c=>c.name)).filter(c=>c!=null);this.activeTimers=e,n&&(this.programTimersStack=null);let i={uploadWaitMs:this.uploadWaitMs,downloadWaitMs:this.downloadWaitMs,kernelMs:null,wallMs:null};return(async()=>{if(F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0){let c=await Promise.all(s);i.kernelMs=y.sum(c),i.getExtraProfileInfo=()=>c.map((p,l)=>({name:a[l],ms:p})).map(p=>`${p.name}: ${p.ms}`).join(", ")}else i.kernelMs={error:"WebGL query timers are not supported in this environment."};return this.uploadWaitMs=0,this.downloadWaitMs=0,i})()}memory(){return{unreliable:!1,numBytesInGPU:this.numBytesInGPU,numBytesInGPUAllocated:this.textureManager.numBytesAllocated,numBytesInGPUFree:this.textureManager.numBytesFree}}startTimer(){return F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0?this.gpgpu.beginQuery():{startMs:y.now(),endMs:null}}endTimer(t){return F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0?(this.gpgpu.endQuery(),t):(t.endMs=y.now(),t)}async getQueryTime(t){if(F().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0)return this.gpgpu.waitForQueryAndGetTime(t);let e=t;return e.endMs-e.startMs}disposeData(t,e=!1){if(this.pendingDisposal.has(t))return!1;if(!this.texData.has(t))return!0;if(e?this.texData.get(t).refCount=0:this.texData.get(t).refCount--,!e&&this.texData.get(t).refCount>0)return!1;if(this.pendingRead.has(t))return this.pendingDisposal.add(t),this.pendingDeletes++,!1;this.releaseGPUData(t);let{complexTensorInfos:o}=this.texData.get(t);return o!=null&&(this.disposeData(o.real.dataId,e),this.disposeData(o.imag.dataId,e)),this.texData.delete(t),!0}releaseGPUData(t){let{texture:e,dtype:o,texShape:n,usage:s,isPacked:a,slice:i}=this.texData.get(t),c=i&&i.origDataId||t,p=this.dataRefCount.get(c);p>1?this.dataRefCount.set(c,p-1):(this.dataRefCount.delete(c),e!=null&&(this.numBytesInGPU-=this.computeBytes(n,o),this.textureManager.releaseTexture(e,n,s,a)));let l=this.texData.get(t);l.texture=null,l.texShape=null,l.isPacked=!1,l.slice=null}getTexture(t){return this.uploadToGPU(t),this.texData.get(t).texture.texture}getDataInfo(t){return this.texData.get(t)}shouldExecuteOnCPU(t,e=q3){return F().getBool("WEBGL_CPU_FORWARD")&&t.every(o=>this.texData.get(o.dataId).texture==null&&y.sizeFromShape(o.shape)<e)}getGPGPUContext(){return this.gpgpu}where(t){I.warn("tf.where() in webgl locks the UI thread. Call tf.whereAsync() instead");let e=t.dataSync();return G3(t.shape,e)}packedUnaryOp(t,e,o){let n=new ze(t.shape,e),s=this.compileAndRun(n,[t],o);return lr().makeTensorFromTensorInfo(s)}abs(t){if(this.shouldExecuteOnCPU([t])&&t.dtype!=="complex64"){let n=Jl(this.texData.get(t.dataId).values);return this.makeOutput(t.shape,t.dtype,n)}if(F().getBool("WEBGL_PACK_UNARY_OPERATIONS"))return this.packedUnaryOp(t,sh,t.dtype);let e=new ge(t.shape,sh),o=this.compileAndRun(e,[t]);return lr().makeTensorFromTensorInfo(o)}makeTensorInfo(t,e,o){let n;if(e==="string"&&o!=null&&o.length>0&&y.isString(o[0])){let s=o.map(a=>y.encodeString(a));n=this.write(s,t,e)}else n=this.write(o,t,e);return this.texData.get(n).usage=null,{dataId:n,shape:t,dtype:e}}makeOutput(t,e,o){return lr().makeTensorFromTensorInfo(this.makeTensorInfo(t,e,o),this)}unpackTensor(t){let e=new ou(t.shape);return this.runWebGLProgram(e,[t],t.dtype)}packTensor(t){let e=new eu(t.shape);return this.runWebGLProgram(e,[t],t.dtype,null,!0)}packedReshape(t,e){let o=[wo(t.shape),...No(t.shape)],n={dtype:t.dtype,shape:o,dataId:t.dataId},s=[wo(e),...No(e)],a=new wi(s,o),i=!0,c=[o],p=this.runWebGLProgram(a,[n],t.dtype,c,i);return{dataId:p.dataId,shape:e,dtype:p.dtype}}decode(t,e){let o=this.texData.get(t),{isPacked:n,shape:s,dtype:a}=o;if(e!=null){let m=y.sizeFromShape(s),f=e[0]*e[1]*4;y.assert(m<=f,()=>"customTexShape is too small. Row * Column * 4 should be equal or larger than the size of the tensor data.")}let i=Wl(s),c;n?c=new ql(i):c=new Kl(i);let p=!0,l=[e??Tc(i)],u=this.runWebGLProgram(c,[{shape:i,dtype:a,dataId:t}],a,l,p,e);return{dtype:a,shape:s,dataId:u.dataId}}runWebGLProgram(t,e,o,n,s=!1,a){let i=this.makeTensorInfo(t.outputShape,o),c=this.texData.get(i.dataId);if(t.packedOutput&&(c.isPacked=!0),t.outPackingScheme===So.DENSE){let x=a??Tc(t.outputShape);c.texShape=x.map(b=>b*2)}if(t.outTexUsage!=null&&(c.usage=t.outTexUsage),y.sizeFromShape(i.shape)===0)return c.values=y.getTypedArrayFromDType(i.dtype,0),i;let p=[],l=e.map(x=>{if(x.dtype==="complex64")throw new Error("GPGPUProgram does not support complex64 input. For complex64 dtypes, please separate the program into real and imaginary parts.");let b=this.texData.get(x.dataId);if(b.texture==null){if(!t.packedInputs&&y.sizeFromShape(x.shape)<=F().getNumber("WEBGL_SIZE_UPLOAD_UNIFORM"))return{shape:x.shape,texData:null,isUniform:!0,uniformValues:b.values};t.packedInputs&&(b.isPacked=!0,b.shape=x.shape)}if(this.uploadToGPU(x.dataId),!!b.isPacked!=!!t.packedInputs)x=b.isPacked?this.unpackTensor(x):this.packTensor(x),p.push(x),b=this.texData.get(x.dataId);else if(b.isPacked&&!Qn(b.shape,x.shape)){let S=x,N=x.shape;x.shape=b.shape,x=this.packedReshape(x,N),p.push(x),b=this.texData.get(x.dataId),S.shape=N}return{shape:x.shape,texData:b,isUniform:!1}});this.uploadToGPU(i.dataId);let u={shape:i.shape,texData:c,isUniform:!1},m=Sw(t,l,u),f=this.getAndSaveBinary(m,()=>Cw(this.gpgpu,t,l,u)),d=this.activeTimers!=null,h;d&&(h=this.startTimer()),F().get("ENGINE_COMPILE_ONLY")||Tw(this.gpgpu,f,l,u,n),p.forEach(x=>this.disposeIntermediateTensorInfo(x)),d&&(h=this.endTimer(h),this.activeTimers.push({name:t.constructor.name,query:this.getQueryTime(h)}));let g=F().get("WEBGL_FLUSH_THRESHOLD");if(g>0){let x=y.now();x-this.lastGlFlushTime>g&&(this.gpgpu.gl.flush(),this.lastGlFlushTime=x)}if(!F().getBool("WEBGL_LAZILY_UNPACK")&&c.isPacked&&s===!1){let x=this.unpackTensor(i);return this.disposeIntermediateTensorInfo(i),x}return i}compileAndRun(t,e,o,n,s=!1){return o=o||e[0].dtype,this.runWebGLProgram(t,e,o,n,s)}getAndSaveBinary(t,e){return t in this.binaryCache||(this.binaryCache[t]=e()),this.binaryCache[t]}getTextureManager(){return this.textureManager}dispose(){this.disposed||(F().getBool("IS_TEST")||Object.keys(this.binaryCache).forEach(e=>{this.gpgpu.deleteProgram(this.binaryCache[e].webGLProgram),delete this.binaryCache[e]}),this.textureManager.dispose(),this.canvas!=null&&typeof HTMLCanvasElement<"u"&&this.canvas instanceof HTMLCanvasElement?this.canvas.remove():this.canvas=null,this.gpgpuCreatedLocally&&(this.gpgpu.program=null,this.gpgpu.dispose()),this.disposed=!0)}floatPrecision(){return this.floatPrecisionValue==null&&(this.floatPrecisionValue=Jt(()=>{if(!F().get("WEBGL_RENDER_FLOAT32_ENABLED")){let t=F().getBool("DEBUG");F().set("DEBUG",!1);let e=this.abs(lt(1e-8)).dataSync()[0];if(F().set("DEBUG",t),e>0)return 32}return 16})),this.floatPrecisionValue}epsilon(){return this.floatPrecision()===32?U3:H3}uploadToGPU(t){let e=this.texData.get(t),{shape:o,dtype:n,values:s,texture:a,usage:i,isPacked:c}=e;if(a!=null)return;let p=this.activeTimers!=null,l;p&&(l=y.now());let u=e.texShape;if(u==null&&(u=iw(o,c),e.texShape=u),s!=null){let m=Wl(o),f,d=u[1],h=u[0],g=s instanceof Uint8Array||s instanceof Uint8ClampedArray;(c||!g)&&([d,h]=Rr(u[0],u[1])),c?f=new Zl(m,g):f=new Yl(m,g);let x=g?[h,d]:u,b=this.makeTensorInfo(x,n),S=this.texData.get(b.dataId);g?S.usage=ue.PIXELS:S.usage=ue.UPLOAD,S.texShape=x,this.gpgpu.uploadDenseMatrixToTexture(this.getTexture(b.dataId),d,h,s);let N=[[h,d]],$=this.runWebGLProgram(f,[b],n,N,!0),R=this.texData.get($.dataId);e.texShape=R.texShape,e.isPacked=R.isPacked,e.usage=R.usage,F().get("ENGINE_COMPILE_ONLY")?this.disposeData($.dataId):(e.texture=R.texture,e.values=null,this.texData.delete($.dataId)),this.disposeIntermediateTensorInfo(b),p&&(this.uploadWaitMs+=y.now()-l)}else{let m=this.acquireTexture(u,i,n,c);e.texture=m}}convertAndCacheOnCPU(t,e){let o=this.texData.get(t),{dtype:n}=o;return this.releaseGPUData(t),e!=null&&(o.values=Y3(e,n)),o.values}acquireTexture(t,e,o,n){if(this.numBytesInGPU+=this.computeBytes(t,o),!this.warnedAboutMemory&&this.numBytesInGPU>this.numMBBeforeWarning*1024*1024){let s=(this.numBytesInGPU/1024/1024).toFixed(2);this.warnedAboutMemory=!0,console.warn(`High memory usage in GPU: ${s} MB, most likely due to a memory leak`)}return this.textureManager.acquireTexture(t,e,n)}computeBytes(t,e){return t[0]*t[1]*y.bytesPerElement(e)}checkCompileCompletion(){for(let[,t]of Object.entries(this.binaryCache))this.checkCompletion_(t)}async checkCompileCompletionAsync(){let t=[];if(this.gpgpu.parallelCompilationExtension){for(let[,e]of Object.entries(this.binaryCache))t.push(this.checkCompletionAsync_(e));return Promise.all(t)}else{for(let[,e]of Object.entries(this.binaryCache)){let o=new Promise(n=>{try{this.checkCompletion_(e),n(!0)}catch(s){throw s}});t.push(o)}return Promise.all(t)}}async checkCompletionAsync_(t){return this.gpgpu.gl.getProgramParameter(t.webGLProgram,this.gpgpu.parallelCompilationExtension.COMPLETION_STATUS_KHR)?this.checkCompletion_(t):(await ed(),this.checkCompletionAsync_(t))}checkCompletion_(t){if(this.gpgpu.gl.getProgramParameter(t.webGLProgram,this.gpgpu.gl.LINK_STATUS)===!1)throw console.log(this.gpgpu.gl.getProgramInfoLog(t.webGLProgram)),this.gpgpu.gl.getShaderParameter(t.fragmentShader,this.gpgpu.gl.COMPILE_STATUS)===!1?(Xd(t.source,this.gpgpu.gl.getShaderInfoLog(t.fragmentShader)),new Error("Failed to compile fragment shader.")):new Error("Failed to link vertex and fragment shaders.");return!0}getUniformLocations(){for(let[,t]of Object.entries(this.binaryCache)){let{uniformLocations:e,customUniformLocations:o,infLoc:n,nanLoc:s,inShapesLocations:a,inTexShapesLocations:i,outShapeLocation:c,outShapeStridesLocation:p,outTexShapeLocation:l}=Qd(this.gpgpu,t.program,t.webGLProgram);t.uniformLocations=e,t.customUniformLocations=o,t.infLoc=n,t.nanLoc=s,t.inShapesLocations=a,t.inTexShapesLocations=i,t.outShapeLocation=c,t.outShapeStridesLocation=p,t.outTexShapeLocation=l}}};vc.nextDataId=0;function Y3(r,t){if(t==="float32"||t==="complex64")return r;if(t==="int32"||t==="bool"){let e=t==="int32"?new Int32Array(r.length):new Uint8Array(r.length);for(let o=0;o<e.length;++o)e[o]=Math.round(r[o]);return e}else throw new Error(`Unknown dtype ${t}`)}co.isBrowser()&&gp("webgl",()=>new vc,2);var Ni=`
  if (isnan(a)) return a;
  if (isnan(b)) return b;
`;var We=class{constructor(t,e,o){this.variableNames=["A","B"],this.outputShape=I.assertAndGetBroadcastShape(e,o),this.enableShapeUniforms=$t(this.outputShape.length),this.userCode=`
      float binaryOperation(float a, float b) {
        ${t}
      }

      void main() {
        float a = getAAtOutCoords();
        float b = getBAtOutCoords();
        setOutput(binaryOperation(a, b));
      }
    `}};var Fr=`
  result.r = isNaN.r ? NAN : result.r;
  result.g = isNaN.g ? NAN : result.g;
  result.b = isNaN.b ? NAN : result.b;
  result.a = isNaN.a ? NAN : result.a;
`;var or=class{constructor(t,e,o,n=!1){this.variableNames=["A","B"],this.supportsBroadcasting=!0,this.packedInputs=!0,this.packedOutput=!0,this.outputShape=I.assertAndGetBroadcastShape(e,o);let s=this.outputShape.length;this.enableShapeUniforms=$t(s);let a="";if(n)if(s===0||y.sizeFromShape(this.outputShape)===1)a=`
          result.y = 0.;
          result.z = 0.;
          result.w = 0.;
        `;else if(a=`
          ${mt(s)} coords = getOutputCoords();
        `,s===1)this.enableShapeUniforms?a+=`
            result.y = (coords + 1) >= outShape ? 0. : result.y;
            result.z = 0.;
            result.w = 0.;
          `:a+=`
            result.y = (coords + 1) >= ${this.outputShape[0]} ? 0. : result.y;
            result.z = 0.;
            result.w = 0.;
          `;else{let c=Ht("coords",s);this.enableShapeUniforms?a+=`
            bool nextRowOutOfBounds =
              (${c[s-2]} + 1) >= outShape[${s} - 2];
            bool nextColOutOfBounds =
              (${c[s-1]} + 1) >= outShape[${s} - 1];
            result.y = nextColOutOfBounds ? 0. : result.y;
            result.z = nextRowOutOfBounds ? 0. : result.z;
            result.w = nextColOutOfBounds || nextRowOutOfBounds ? 0. : result.w;
          `:a+=`
            bool nextRowOutOfBounds =
              (${c[s-2]} + 1) >= ${this.outputShape[s-2]};
            bool nextColOutOfBounds =
              (${c[s-1]} + 1) >= ${this.outputShape[s-1]};
            result.y = nextColOutOfBounds ? 0. : result.y;
            result.z = nextRowOutOfBounds ? 0. : result.z;
            result.w = nextColOutOfBounds || nextRowOutOfBounds ? 0. : result.w;
          `}this.userCode=`
      vec4 binaryOperation(vec4 a, vec4 b) {
        ${t}
      }

      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();

        vec4 result = binaryOperation(a, b);
        ${a}

        setOutput(result);
      }
    `}};function Kt(r){let{inputs:t,backend:e}=r,{x:o}=t;return e.incRef(o.dataId),{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}var WN={kernelName:oo,backendName:"webgl",kernelFunc:Kt};function ve(r){let{inputs:t,backend:e}=r,{real:o,imag:n}=t,s=e.makeTensorInfo(o.shape,"complex64"),a=e.texData.get(s.dataId),i=Kt({inputs:{x:o},backend:e}),c=Kt({inputs:{x:n},backend:e});return a.complexTensorInfos={real:i,imag:c},s}var GN={kernelName:Ss,backendName:"webgl",kernelFunc:ve};var ah="return (a < 0.) ? b * a : a;",ih=`
  vec4 aLessThanZero = vec4(lessThan(a, vec4(0.)));
  return (aLessThanZero * (b * a)) + ((vec4(1.0) - aLessThanZero) * a);
`;function Z3(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{alpha:s}=o,a=e.makeTensorInfo([],"float32",y.createScalarValue(s,"float32")),i=F().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new or(ih,n.shape,a.shape):new We(ah,n.shape,a.shape),c=e.runWebGLProgram(i,[n,a],"float32");return e.disposeIntermediateTensorInfo(a),c}var UN={kernelName:js,backendName:"webgl",kernelFunc:Z3};var ch="return (a < 0.) ? b * a : a;",ph=`
  vec4 aLessThanZero = vec4(lessThan(a, vec4(0.)));
  return (aLessThanZero * (b * a)) + ((vec4(1.0) - aLessThanZero) * a);
`;function Q3(r){let{inputs:t,backend:e}=r,{x:o,alpha:n}=t,s=F().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new or(ph,o.shape,n.shape):new We(ch,o.shape,n.shape);return e.runWebGLProgram(s,[o,n],"float32")}var HN={kernelName:la,backendName:"webgl",kernelFunc:Q3};var nr="if (isnan(x)) return x;";function rt({opSnippet:r,packedOpSnippet:t,cpuKernelImpl:e,dtype:o}){return({inputs:n,backend:s})=>{let{x:a}=n,i=s,c=o||a.dtype;if(i.shouldExecuteOnCPU([a])&&e!=null){let u=i.texData.get(a.dataId),m=e(u.values,c);return i.makeTensorInfo(a.shape,c,m)}let p=F().getBool("WEBGL_PACK_UNARY_OPERATIONS")&&t!=null,l;return p?l=new ze(a.shape,t):l=new ge(a.shape,r),i.runWebGLProgram(l,[a],c)}}function Nt({opSnippet:r,packedOpSnippet:t,checkOutOfBounds:e=!1,supportsComplex:o=!1,cpuKernelImpl:n,dtype:s}){return({inputs:a,backend:i})=>{let{a:c,b:p}=a,l=i;if(o&&c.dtype==="complex64"){let d=l.texData.get(c.dataId),h=l.texData.get(p.dataId),[g,x]=[[d.complexTensorInfos.real,h.complexTensorInfos.real],[d.complexTensorInfos.imag,h.complexTensorInfos.imag]].map(S=>{let[N,k]=S,$={dataId:N.dataId,dtype:N.dtype,shape:c.shape},R={dataId:k.dataId,dtype:k.dtype,shape:p.shape},A=new We(r,c.shape,p.shape);return l.runWebGLProgram(A,[$,R],Yt(N.dtype,k.dtype))}),b=ve({inputs:{real:g,imag:x},backend:l});return l.disposeIntermediateTensorInfo(g),l.disposeIntermediateTensorInfo(x),b}let u=s||Yt(c.dtype,p.dtype);if((c.dtype==="string"||p.dtype==="string"||l.shouldExecuteOnCPU([c,p]))&&n!=null){let d=l.texData.get(c.dataId).values,h=l.texData.get(p.dataId).values,g=c.dtype==="string"?I.fromUint8ToStringArray(d):d,x=c.dtype==="string"?I.fromUint8ToStringArray(h):h,[b,S]=n(c.shape,p.shape,g,x,u),N=l.makeTensorInfo(S,u),k=l.texData.get(N.dataId);return k.values=b,N}let m=F().getBool("WEBGL_PACK_BINARY_OPERATIONS")&&t!=null,f;return m?f=new or(t,c.shape,p.shape,e):f=new We(r,c.shape,p.shape),l.runWebGLProgram(f,[c,p],u)}}function qr(r,t=!1){if(r==="linear")return t?LN:AN;if(r==="relu")return t?VN:DN;if(r==="elu")return t?BN:FN;if(r==="relu6")return t?MN:_N;if(r==="prelu")return t?ph:ch;if(r==="leakyrelu")return t?ih:ah;if(r==="sigmoid")return t?zN:ON;throw new Error(`Activation ${r} has not been implemented for the WebGL backend.`)}var Ii=class{constructor(t,e,o,n=!1,s=!1,a=!1,i=null,c=!1,p=!1){this.variableNames=["matrixA","matrixB"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=o,this.enableShapeUniforms=$t(this.outputShape.length);let l=n?t[1]:t[2],u=Math.ceil(l/2),m=n?"i * 2, rc.y":"rc.y, i * 2",f=s?"rc.z, i * 2":"i * 2, rc.z",d=n?["a.xxyy","a.zzww"]:["a.xxzz","a.yyww"],h=s?["b.xzxz","b.ywyw"]:["b.xyxy","b.zwzw"],g="",x="";i&&(c?g=`vec4 activation(vec4 a) {
          vec4 b = getPreluActivationWeightsAtOutCoords();
          ${i}
        }`:p?g=`vec4 activation(vec4 a) {
          vec4 b = getLeakyreluAlphaAtOutCoords();
          ${i}
        }`:g=`vec4 activation(vec4 x) {
          ${i}
        }`,x="result = activation(result);");let b=a?"result += getBiasAtOutCoords();":"";a&&this.variableNames.push("bias"),c&&this.variableNames.push("preluActivationWeights"),p&&this.variableNames.push("leakyreluAlpha");let S="rc.x",N="rc.x";t[0]<e[0]?S=`int(min(float(rc.x), ${t[0]-1}.))`:e[0]<t[0]&&(N=`int(min(float(rc.x), ${e[0]-1}.))`),this.userCode=`
      ${g}
      // Don't use uniform for sharedDimensionPacked for performance.
      const float sharedDimension = ${u}.0;

      vec4 dot2x2ARowBCol(ivec3 rc) {
        vec4 result = vec4(0);
        for (int i = 0; i < ${u}; i++) {
          int batchA = ${S};
          int batchB = ${N};
          vec4 a = getMatrixA(batchA, ${m});
          vec4 b = getMatrixB(batchB, ${f});

          // These swizzled products need to be separately added.
          // See: https://github.com/tensorflow/tfjs/issues/1735
          result += (${d[0]} * ${h[0]});
          result += (${d[1]} * ${h[1]});
        }
        return result;
      }

      void main() {
        ivec3 rc = getOutputCoords();
        vec4 result = dot2x2ARowBCol(rc);

        ${b}

        ${x}

        setOutput(result);
      }
    `}};var lh={REAL:"return areal * breal - aimag * bimag;",IMAG:"return areal * bimag + aimag * breal;"},kc=class{constructor(t,e,o){this.variableNames=["AReal","AImag","BReal","BImag"],this.outputShape=I.assertAndGetBroadcastShape(e,o),this.userCode=`
      float binaryOpComplex(
          float areal, float aimag, float breal, float bimag) {
        ${t}
      }

      void main() {
        float areal = getARealAtOutCoords();
        float aimag = getAImagAtOutCoords();
        float breal = getBRealAtOutCoords();
        float bimag = getBImagAtOutCoords();
        setOutput(binaryOpComplex(areal, aimag, breal, bimag));
      }
    `}};var KN="return a * b;";function Ec(r){let{inputs:t,backend:e}=r,{a:o,b:n}=t,s=I.upcastType(o.dtype,n.dtype);if(o.dtype==="complex64"){let i=e.texData.get(o.dataId),c=e.texData.get(n.dataId),p=new kc(lh.REAL,o.shape,n.shape),l=new kc(lh.IMAG,o.shape,n.shape),u=[{dataId:i.complexTensorInfos.real.dataId,dtype:i.complexTensorInfos.real.dtype,shape:o.shape},{dataId:i.complexTensorInfos.imag.dataId,dtype:i.complexTensorInfos.imag.dtype,shape:o.shape},{dataId:c.complexTensorInfos.real.dataId,dtype:c.complexTensorInfos.real.dtype,shape:n.shape},{dataId:c.complexTensorInfos.imag.dataId,dtype:c.complexTensorInfos.imag.dtype,shape:n.shape}],m=e.runWebGLProgram(p,u,"float32"),f=e.runWebGLProgram(l,u,"float32"),d=ve({inputs:{real:m,imag:f},backend:e});return e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),d}if(e.shouldExecuteOnCPU([o,n])){let i=e.texData.get(o.dataId),c=e.texData.get(n.dataId),[p,l]=sN(o.shape,n.shape,i.values,c.values,s),u=e.makeTensorInfo(l,s),m=e.texData.get(u.dataId);return m.values=p,u}let a;return F().getBool("WEBGL_PACK_BINARY_OPERATIONS")?a=new or(KN,o.shape,n.shape):a=new We(KN,o.shape,n.shape),e.runWebGLProgram(a,[o,n],s)}var qN={kernelName:sn,backendName:"webgl",kernelFunc:Ec};function XN(r,t,e){let o=[wo(r.shape),...No(r.shape)],n={dtype:r.dtype,shape:o,dataId:r.dataId},s=[wo(t),...No(t)],a=new wi(s,o),i=!0,c=[o],p=e.runWebGLProgram(a,[n],r.dtype,c,i);return{dataId:p.dataId,shape:t,dtype:p.dtype}}function K(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{shape:s}=o,a=e,i=y.sizeFromShape(n.shape),c=y.inferFromImplicitShape(s,i),p=y.sizeFromShape(c);y.assert(i===p,()=>`The new shape (${c}) has ${p} elements and the old shape (${n.shape}) has ${i} elements. The new shape and old shape must have the same number of elements.`);let l=a.texData.get(n.dataId);return l.isPacked&&!Qn(n.shape,c)&&!(l.texture!==null&&Qn(l.shape,c))?XN(n,c,a):(a.incRef(n.dataId),{dataId:n.dataId,shape:c,dtype:n.dtype})}var jN={kernelName:ga,backendName:"webgl",kernelFunc:K};var $c=class{constructor(t,e){this.variableNames=["x"];let{windowSize:o,batchSize:n,inSize:s,outSize:a}=t;this.outputShape=[n,a];let i=Math.floor(o/4)*4,c=o%4,p="sumValue += dot(values, ones);";if(e!=null){let u=1/e;p=`sumValue += dot(values * ${y.isInt(u)?u.toPrecision(2):u}, ones);`}let l="";s%o>0&&(l=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return 0.0;
        }
      `),this.userCode=`
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float getValue(int batch, int inIdx) {
        ${l}
        return getX(batch, inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${o};

        float sumValue = 0.0;

        for (int i = 0; i < ${i}; i += 4) {
          int inIdx = inOffset + i;
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          ${p}
        }

        int inIdx = inOffset + ${i};
        if (${c===1}) {
          vec4 values = vec4(getValue(batch, inIdx), 0.0, 0.0, 0.0);

          ${p}
        } else if (${c===2}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1), 0.0, 0.0);

          ${p}
        } else if (${c===3}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2), 0.0);

          ${p}
        }
        setOutput(sumValue);
      }
    `}};var su=class{constructor(t,e){this.variableNames=["x"];let{windowSize:o,batchSize:n,inSize:s,outSize:a}=t;this.outputShape=[n,a];let i="0.0",c="";e==="prod"?i="1.0":e==="min"?(i="1.0 / 1e-20",c="min"):e==="max"&&(i="-1.0 / 1e-20",c="max");let p=`${e}(${e}(${e}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;e==="sum"?p="sumValue":e==="prod"?p="prodValue":e==="all"?p="allValue":e==="any"&&(p="anyValue");let l=Math.floor(o/4)*4,u=o%4,m=`
      if (${e==="sum"}) {
        sumValue += dot(values, ones);
      } else if (${e==="prod"}) {
        vec2 tmp = vec2(values[0], values[1]) * vec2(values[2], values[3]);
        prodValue *= tmp[0] * tmp[1];
      } else {
        minMaxValue = ${c}(values, minMaxValue);
        if (${e==="min"} || ${e==="max"}) {
          minMaxValue = ${c}(values, minMaxValue);
          bvec4 isNaN = isnan(values);
          if (isNaN.r || isNaN.g || isNaN.b || isNaN.a) {
            minMaxValue = vec4(NAN);
          }
        }
      }
    `,f="vec4";e==="all"?(i="1.0",m=`
        bool reducedAllValue = all(values);
        float floatedReducedAllValue = float(reducedAllValue);
        allValue = float(allValue >= 1.0 && floatedReducedAllValue >= 1.0);
      `,f="bvec4"):e==="any"&&(i="0.0",m=`
        bool reducedAnyValue = any(values);
        float floatedReducedAnyValue = float(reducedAnyValue);
        anyValue = float(anyValue >= 1.0 || floatedReducedAnyValue >= 1.0);
      `,f="bvec4");let d="";s%o>0&&(d=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return initializationValue;
        }
      `),this.userCode=`
      const float initializationValue = ${i};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float getValue(int batch, int inIdx) {
        ${d}
        return getX(batch, inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${o};

        vec4 minMaxValue = vec4(${i});
        float prodValue = 1.0;
        float sumValue = 0.0;
        float allValue = 1.0;
        float anyValue = 0.0;

        for (int i = 0; i < ${l}; i += 4) {
          int inIdx = inOffset + i;
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          ${m}
        }

        int inIdx = inOffset + ${l};
        if (${u===1}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            initializationValue,
            initializationValue,
            initializationValue
          );

          ${m}
        } else if (${u===2}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            initializationValue,
            initializationValue
          );

          ${m}
        } else if (${u===3}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            initializationValue
          );

          ${m}
        }
        setOutput(${p});
      }
    `}};function tB(r){let t=[];for(;t.length===0||t[t.length-1].outSize!==1;){let e=t.length?t[t.length-1].outSize:r[1],o=I.computeOptimalWindowSize(e);t.push({inSize:e,windowSize:o,outSize:Math.ceil(e/o)})}return t}function De(r,t,e,o){let n=tB(r.shape),s=r;for(let a=0;a<n.length;a++){let{inSize:i,windowSize:c,outSize:p}=n[a],l,u;e==="mean"?l=a===0?new $c({windowSize:c,inSize:i,batchSize:r.shape[0],outSize:p},i):new $c({windowSize:c,inSize:i,batchSize:r.shape[0],outSize:p}):l=new su({windowSize:c,inSize:i,batchSize:r.shape[0],outSize:p},e),u=s,s=o.runWebGLProgram(l,[s],t),u.dataId!==r.dataId&&o.disposeIntermediateTensorInfo(u)}return s}var au=class{constructor(t,e){this.variableNames=["A"];let o=new Array(t.length);for(let a=0;a<o.length;a++)o[a]=t[e[a]];this.outputShape=o,this.rank=o.length;let n=mt(this.rank),s=eB(e);this.userCode=`
    void main() {
      ${n} resRC = getOutputCoords();
      setOutput(getA(${s}));
    }
    `}};function eB(r){let t=r.length;if(t>6)throw Error(`Transpose for rank ${t} is not yet supported`);let e=["resRC.x","resRC.y","resRC.z","resRC.w","resRC.u","resRC.v"],o=new Array(t);for(let n=0;n<r.length;n++)o[r[n]]=e[n];return o.join()}var iu=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0;let o=new Array(t.length);for(let l=0;l<o.length;l++)o[l]=t[e[l]];if(this.outputShape=o,this.rank=o.length,this.rank>6)throw Error(`Packed transpose for rank ${this.rank} is not yet supported.`);let n=mt(this.rank),s=nh("rc",this.rank),a=new Array(this.rank);for(let l=0;l<e.length;l++)a[e[l]]=s[l];let i=`vec2(${a.slice(-2).join()})`,c=`++${s[this.rank-1]} < ${o[this.rank-1]}`,p=`getChannel(getA(${a.join()}), ${i})`;this.userCode=`
    void main() {
      ${n} rc = getOutputCoords();
      vec4 result = vec4(0.);
      result[0] = ${p};
      if(${c}) {
        result[1] = ${p};
      }
      --${s[this.rank-1]};
      if(++${s[this.rank-2]} < ${o[this.rank-2]}) {
        result[2] = ${p};
        if(${c}) {
          result[3] = ${p};
        }
      }
      setOutput(result);
    }
    `}};function Io(r,t,e){let o=F().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new iu(r.shape,t):new au(r.shape,t);return e.runWebGLProgram(o,[r],r.dtype)}function YN(r,t,e,o){let n=t,s=r.shape.length,a=y.parseAxisParam(n,r.shape),i=a,c=I.getAxesPermutation(i,s),p=c!=null,l=r;p&&(l=Io(r,c,o),i=I.getInnerMostAxes(i.length,s)),I.assertAxesAreInnerMostDims("sum",i,s);let[u,m]=I.computeOutAndReduceShapes(l.shape,i),f=u;e&&(f=I.expandShapeToKeepDim(u,a));let d=y.sizeFromShape(m),g=y.sizeFromShape(r.shape)/d,x=K({inputs:{x:l},attrs:{shape:[g,d]},backend:o}),b=Rn(r.dtype),S=De(x,b,"sum",o),N=K({inputs:{x:S},attrs:{shape:f},backend:o});return o.disposeIntermediateTensorInfo(x),o.disposeIntermediateTensorInfo(S),p&&o.disposeIntermediateTensorInfo(l),N}function os(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;return YN(n,s,a,e)}var ZN={kernelName:"Sum",backendName:"webgl",kernelFunc:os};function _t(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{perm:s}=o,a=e,i=n.shape.length,c=new Array(i);for(let l=0;l<c.length;l++)c[l]=n.shape[s[l]];let p;if(a.shouldExecuteOnCPU([n])){let u=a.texData.get(n.dataId).values,m=es(u,n.shape,n.dtype,s,c);p=a.makeTensorInfo(c,n.dtype);let f=a.texData.get(p.dataId);f.values=m}else p=Io(n,s,a);return p}var QN={kernelName:so,backendName:"webgl",kernelFunc:_t};var uh=1e3;function ns({a:r,b:t,transposeA:e,transposeB:o,backend:n,bias:s=null,preluActivationWeights:a=null,leakyreluAlpha:i=0,activation:c=null}){let p=r.shape.length,l=t.shape.length,u=e?r.shape[p-2]:r.shape[p-1],m=o?t.shape[l-1]:t.shape[l-2],f=e?r.shape[p-1]:r.shape[p-2],d=o?t.shape[l-2]:t.shape[l-1],h=r.shape.slice(0,-2),g=t.shape.slice(0,-2),x=y.sizeFromShape(h),b=y.sizeFromShape(g),N=Tr.assertAndGetBroadcastShape(r.shape.slice(0,-2),t.shape.slice(0,-2)).concat([f,d]);y.assert(u===m,()=>`Error in matMul: inner shapes (${u}) and (${m}) of Tensors with shapes ${r.shape} and ${t.shape} and transposeA=${e} and transposeB=${o} must match.`);let k=e?[x,u,f]:[x,f,u],$=o?[b,d,m]:[b,m,d],R=K({inputs:{x:r},backend:n,attrs:{shape:k}}),A=K({inputs:{x:t},backend:n,attrs:{shape:$}}),D=[R,A],_=Math.max(x,b),O=e?R.shape[1]:R.shape[2],L=s!=null,B=a!=null,M=c==="leakyrelu",V=c!=null?qr(c,!0):null,G=L||B||M||V!=null,U;if((f===1||d===1)&&O>uh&&G===!1){let H=R,q=A;e&&(H=_t({inputs:{x:R},backend:n,attrs:{perm:[0,2,1]}}),D.push(H)),o&&(q=_t({inputs:{x:A},backend:n,attrs:{perm:[0,2,1]}}),D.push(q));let X=d!==1,Z=d===1,j=H;X&&(j=K({inputs:{x:H},backend:n,attrs:{shape:[_,O,1]}}),D.push(j));let J=d===1?2:1,Y=q;Z&&(Y=K({inputs:{x:q},backend:n,attrs:{shape:[_,1,O]}}),D.push(Y));let et=Ec({inputs:{a:j,b:Y},backend:n});U=os({inputs:{x:et},backend:n,attrs:{axis:J,keepDims:!0}}),D.push(et)}else{let H=Yt(r.dtype,t.dtype),q=new Ii(k,$,[_,f,d],e,o,L,V,B,M),X=[R,A];if(s!=null&&X.push(s),B&&X.push(a),M){let Z=n.makeTensorInfo([],"float32",y.createScalarValue(i,"float32"));X.push(Z),D.push(Z)}U=n.runWebGLProgram(q,X,H)}let z=K({inputs:{x:U},backend:n,attrs:{shape:N}});D.push(U);for(let H of D)n.disposeIntermediateTensorInfo(H);return z}function rB(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s,bias:a,preluActivationWeights:i}=t,{transposeA:c,transposeB:p,activation:l,leakyreluAlpha:u}=o;return ns({a:n,b:s,transposeA:c,transposeB:p,backend:e,bias:a,preluActivationWeights:i,leakyreluAlpha:u,activation:l})}var JN={kernelName:Sn,backendName:"webgl",kernelFunc:rB};var t1="return abs(x);";function oB(r){let{inputs:t,backend:e}=r,{x:o}=t;if(e.shouldExecuteOnCPU([o])&&o.dtype!=="complex64"){let s=e.texData.get(o.dataId),a=Jl(s.values);return e.makeTensorInfo(o.shape,o.dtype,a)}let n;return F().getBool("WEBGL_PACK_UNARY_OPERATIONS")?n=new ze(o.shape,t1):n=new ge(o.shape,t1),e.runWebGLProgram(n,[o],o.dtype)}var e1={kernelName:"Abs",backendName:"webgl",kernelFunc:oB};var nB=te+`
  if (abs(x) > 1.) {
    return NAN;
  }
  return acos(x);
`,sB=rt({opSnippet:nB}),r1={kernelName:Ao,backendName:"webgl",kernelFunc:sB};var aB=te+`
  if (x < 1.0) return NAN;
return log(x + sqrt(x * x - 1.0));`,iB=rt({opSnippet:aB}),o1={kernelName:Fo,backendName:"webgl",kernelFunc:iB};var n1="return a + b;",cB=Nt({opSnippet:n1,packedOpSnippet:n1,supportsComplex:!0,cpuKernelImpl:Vw}),s1={kernelName:"Add",backendName:"webgl",kernelFunc:cB};var cu=class{constructor(t,e){this.outputShape=[],this.outputShape=t,this.variableNames=e.map((s,a)=>`T${a}`);let o=[];this.variableNames.forEach(s=>{o.push(`float v${s} = get${s}AtOutCoords();`)});let n=this.variableNames.map(s=>`v${s}`).join(" + ");this.userCode=`
      void main() {
        ${o.join(`
        `)}

        float result = ${n};
        setOutput(result);
      }
    `}};var pu=class{constructor(t,e){this.outputShape=[],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t,this.variableNames=e.map((s,a)=>`T${a}`);let o=[];this.variableNames.forEach(s=>{o.push(`vec4 v${s} = get${s}AtOutCoords();`)});let n=this.variableNames.map(s=>`v${s}`).join(" + ");this.userCode=`
      void main() {
        ${o.join(`
        `)}

        vec4 result = ${n};
        setOutput(result);
      }
    `}};function lu(r){let{inputs:t,backend:e}=r,o=t;if(o.length===1)return Kt({inputs:{x:o[0]},backend:e});if(o.length>F().get("WEBGL_MAX_TEXTURES_IN_SHADER")){let c=Math.floor(o.length/2),p=lu({inputs:o.slice(0,c),backend:e}),l=lu({inputs:o.slice(c),backend:e});return lu({inputs:[p,l],backend:e})}let n=o.map(c=>c.dtype).reduce((c,p)=>Yt(c,p)),s=o.map(c=>c.shape),i=F().getBool("WEBGL_PACK")?new pu(o[0].shape,s):new cu(o[0].shape,s);return e.runWebGLProgram(i,o,n)}var a1={kernelName:fs,backendName:"webgl",kernelFunc:lu};function pB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,c=y.parseAxisParam(s,n.shape),p=c,l=I.getAxesPermutation(p,i),u=n;l!=null&&(u=_t({inputs:{x:n},backend:e,attrs:{perm:l}}),p=I.getInnerMostAxes(p.length,i)),I.assertAxesAreInnerMostDims("all",p,i);let[m,f]=I.computeOutAndReduceShapes(u.shape,p),d=y.sizeFromShape(f),h=K({inputs:{x:u},backend:e,attrs:{shape:[-1,d]}}),g=De(h,h.dtype,"all",e),x;if(a){let b=I.expandShapeToKeepDim(m,c);x=K({inputs:{x:g},backend:e,attrs:{shape:b}})}else x=K({inputs:{x:g},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(h),e.disposeIntermediateTensorInfo(g),l!=null&&e.disposeIntermediateTensorInfo(u),x}var i1={kernelName:"All",backendName:"webgl",kernelFunc:pB};function lB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,c=y.parseAxisParam(s,n.shape),p=c,l=I.getAxesPermutation(p,i),u=n;l!=null&&(u=_t({inputs:{x:n},backend:e,attrs:{perm:l}}),p=I.getInnerMostAxes(p.length,i)),I.assertAxesAreInnerMostDims("any",p,i);let[m,f]=I.computeOutAndReduceShapes(u.shape,p),d=y.sizeFromShape(f),h=K({inputs:{x:u},backend:e,attrs:{shape:[-1,d]}}),g=De(h,h.dtype,"any",e),x;if(a){let b=I.expandShapeToKeepDim(m,c);x=K({inputs:{x:g},backend:e,attrs:{shape:b}})}else x=K({inputs:{x:g},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(h),e.disposeIntermediateTensorInfo(g),l!=null&&e.disposeIntermediateTensorInfo(u),x}var c1={kernelName:"Any",backendName:"webgl",kernelFunc:lB};var uu=class{constructor(t,e,o){this.variableNames=["A"];let{windowSize:n,batchSize:s,outSize:a}=t;o||this.variableNames.push("bestIndicesA"),this.outputShape=[s,a];let i=e==="max"?">":"<",c=o?"inOffset + i;":"round(getBestIndicesA(batch, inOffset + i));";this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${n};

        int bestIndex = inOffset;
        float bestValue = getA(batch, bestIndex);

        for (int i = 0; i < ${n}; i++) {
          int inIdx = ${c};
          float candidate = getA(batch, inIdx);
          if (candidate ${i} bestValue) {
            bestValue = candidate;
            bestIndex = inIdx;
          }
        }
        setOutput(float(bestIndex));
      }
    `}};var mu=class{constructor(t,e,o,n){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,y.assert(t.length>2,()=>`Packed arg${o.charAt(0).toUpperCase()+o.slice(1)} supports only inputs with rank above 2.`);let s=t[t.length-1],a=Math.ceil(s/e);this.outputShape=t.slice(0,-1),a>1&&this.outputShape.push(a),n||this.variableNames.push("bestIndicesA");let i=this.outputShape,c=i.length,p=mt(c),l=Ht("coords",c),u,m;if(a===1){m=c+1;let A=mt(m);u=`
        ${A} sourceLocR = ${A}(${l.join()}, 0);
        ++${l[c-1]};
        ${A} sourceLocG = ${A}(${l.join()}, 0);
        ++${l[c-2]};
        ${A} sourceLocA = ${A}(${l.join()}, 0);
        --${l[c-1]};
        ${A} sourceLocB = ${A}(${l.join()}, 0);
        --${l[c-2]};`}else m=c,u=`
        ${p} sourceLocR = coords;
        ++${l[c-1]};
        ${p} sourceLocG = coords;
        ++${l[c-2]};
        ${p} sourceLocA = coords;
        --${l[c-1]};
        ${p} sourceLocB = coords;
        --${l[c-2]};`;let f=["x","y","z","w","u","v"].slice(0,m),d="."+f[m-1],h=f.map(A=>"int "+A),g=Ht("sourceLocR",m-1).concat("inIdx.r"),x=Ht("sourceLocG",m-1).concat("inIdx.g"),b=Ht("sourceLocB",m-1).concat("inIdx.b"),S=Ht("sourceLocA",m-1).concat("inIdx.a"),N=o==="max"?"greaterThan":"lessThan",k=n?"":`
          inIdx = round(vec4(getBestIndicesAChannel(${g.join()}),
                             getBestIndicesAChannel(${x.join()}),
                             getBestIndicesAChannel(${b.join()}),
                             getBestIndicesAChannel(${S.join()})));`,$=`vec4(
            getAChannel(${g.join()}),
            hasNextCol ? getAChannel(${x.join()}) : 0.,
            hasNextRow ? getAChannel(${b.join()}) : 0.,
            hasNextRow && hasNextCol ? getAChannel(${S.join()}) : 0.)`,R=n?"":`
      float getBestIndicesAChannel(${h.join()}) {
        return getChannel(getBestIndicesA(${f.join()}),
                                          vec2(${f.slice(-2).join()}));
      }`;this.userCode=`
      float getAChannel(${h.join()}) {
        return getChannel(getA(${f.join()}),
                               vec2(${f.slice(-2).join()}));
      }
      ${R}
      void main() {
        ${p} coords = getOutputCoords();
        bool hasNextCol = ${l[c-1]} < ${i[c-1]-1};
        bool hasNextRow = ${l[c-2]} < ${i[c-2]-1};
        ${u}
        ivec4 srcIdx = ivec4(sourceLocR${d}, sourceLocG${d},
          sourceLocB${d}, sourceLocA${d}) * ${e};
        ivec4 inIdx = srcIdx;
        vec4 bestIndex = vec4(inIdx);
        vec4 bestValue = ${$};

        for (int i = 0; i < ${e}; i++) {
          inIdx = srcIdx;
          ${k}
          vec4 candidate = ${$};
          bvec4 nan = isnan(candidate);
          bvec4 replace = bvec4(
            vec4(${N}(candidate, bestValue)) * (vec4(1.0) - vec4(nan)));

          bestValue = vec4(replace.x  ? candidate.x : bestValue.x,
                           replace.y  ? candidate.y : bestValue.y,
                           replace.z  ? candidate.z : bestValue.z,
                           replace.w  ? candidate.w : bestValue.w);
          bestIndex = mix(bestIndex, vec4(inIdx), vec4(replace));
          srcIdx++;
        }
        setOutput(bestIndex);
      }
    `}};function p1(r,t,e,o=null){let n=t.shape[0],s=t.shape[1];o!=null&&(n=o.shape[0],s=o.shape[1]);let a=I.computeOptimalWindowSize(s),i={windowSize:a,inSize:s,batchSize:n,outSize:Math.ceil(s/a)},c=new uu(i,e,o==null),p=[t];o!=null&&p.push(o);let l=r.runWebGLProgram(c,p,"int32");if(l.shape[1]===1)return l;let u=p1(r,t,e,l);return r.disposeIntermediateTensorInfo(l),u}function l1(r,t,e,o=null){let n=o!=null?o.shape:t.shape,s=n[n.length-1],a=I.computeOptimalWindowSize(s),i=new mu(n,a,e,o==null),c=o==null?[t]:[t,o],p=r.runWebGLProgram(i,c,"int32");if(p.shape.length===t.shape.length){let l=l1(r,t,e,p);return r.disposeIntermediateTensorInfo(p),l}return p}function fu(r,t,e,o){let n=[e];if(I.assertAxesAreInnerMostDims("arg"+o.charAt(0).toUpperCase()+o.slice(1),n,t.shape.length),!F().getBool("WEBGL_PACK_REDUCE")||t.shape.length<=2){let s=[],a=r.texData.get(t.dataId),i=a!==null&&a.isPacked,c=t;i&&(c=r.unpackTensor(t),s.push(c));let[p,l]=I.computeOutAndReduceShapes(c.shape,n),u=y.sizeFromShape(l),m=K({inputs:{x:c},backend:r,attrs:{shape:[-1,u]}});s.push(m);let f=p1(r,m,o);s.push(f);let d=K({inputs:{x:f},backend:r,attrs:{shape:p}});return s.forEach(h=>r.disposeIntermediateTensorInfo(h)),d}return l1(r,t,o)}function uB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o,a=y.parseAxisParam(s,n.shape),i=I.getAxesPermutation(a,n.shape.length),c=n,p=[];i!=null&&(c=_t({inputs:{x:n},backend:e,attrs:{perm:i}}),p.push(c),a=I.getInnerMostAxes(a.length,c.shape.length)),I.assertAxesAreInnerMostDims("argMax",[a[0]],c.shape.length);let l=fu(e,c,a[0],"max");return p.forEach(u=>e.disposeIntermediateTensorInfo(u)),l}var u1={kernelName:ds,backendName:"webgl",kernelFunc:uB};function mB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o,a=y.parseAxisParam(s,n.shape),i=I.getAxesPermutation(a,n.shape.length),c=n,p=[];i!=null&&(c=_t({inputs:{x:n},backend:e,attrs:{perm:i}}),p.push(c),a=I.getInnerMostAxes(a.length,c.shape.length)),I.assertAxesAreInnerMostDims("argMin",[a[0]],c.shape.length);let l=fu(e,c,a[0],"min");return p.forEach(u=>e.disposeIntermediateTensorInfo(u)),l}var m1={kernelName:hs,backendName:"webgl",kernelFunc:mB};var fB=te+`
  if (abs(x) > 1.) {
    return NAN;
  }
  return asin(x);
`,dB=rt({opSnippet:fB}),f1={kernelName:Do,backendName:"webgl",kernelFunc:dB};var hB=te+"return log(x + sqrt(x * x + 1.0));",gB=rt({opSnippet:hB}),d1={kernelName:_o,backendName:"webgl",kernelFunc:gB};var xB=te+`
  return atan(x);
`,yB=rt({opSnippet:xB}),h1={kernelName:Oo,backendName:"webgl",kernelFunc:yB};var bB=Ni+`
  return atan(a, b);
`,CB=`
  vec4 result = atan(a, b);
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+Fr+`
  return result;
`,TB=Nt({opSnippet:bB,packedOpSnippet:CB}),g1={kernelName:Lo,backendName:"webgl",kernelFunc:TB};var SB=te+`
  if ((x < -1.0) || (x > 1.0)) return NAN;
return (log(1.0 + x) - log(1.0 - x)) / 2.0;`,wB=rt({opSnippet:SB}),x1={kernelName:Po,backendName:"webgl",kernelFunc:wB};var dr=class{constructor(t,e,o,n=!1,s=!1){if(this.variableNames=["x"],e==="avg"&&o)throw new Error("Cannot compute positions for average pool.");let a=t.filterWidth,i=t.strideHeight,c=t.strideWidth,p=t.dilationHeight,l=t.dilationWidth,u=t.effectiveFilterHeight,m=t.effectiveFilterWidth,f=t.padInfo.top,d=t.padInfo.left;this.outputShape=t.outShape;let h=e==="avg",g=`((batch  * ${t.inHeight} + xR) * ${t.inWidth} + xC) * ${t.inChannels} + d`,x=`(xR * ${t.inWidth} + xC) * ${t.inChannels} + d`,b="0.0";if(h||(b="-1.0 / 1e-20"),o){this.userCode=`
        const ivec2 strides = ivec2(${i}, ${c});
        const ivec2 pads = ivec2(${f}, ${d});

        void main() {
          ivec4 coords = getOutputCoords();
          int batch = coords[0];
          int d = coords[3];

          ivec2 xRCCorner = coords.yz * strides - pads;
          int xRCorner = xRCCorner.x;
          int xCCorner = xRCCorner.y;

          // max/min x(?, ?, d) to get y(yR, yC, d).
          // ? = to be determined
          float minMaxValue = 0.0;
          float minMaxValueFound = 0.0;
          int minMaxPosition = 0;
          float avgValue = 0.0;

          for (int wR = 0; wR < ${u};
              wR += ${p}) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${m};
                wC += ${l}) {
              int xC = xCCorner + wC;

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              float value = getX(batch, xR, xC, d);

              // If a min / max value has already been found, use it. If not,
              // use the current value.
              float currMinMaxValue = mix(
                  value, minMaxValue, minMaxValueFound);
              if (value >= currMinMaxValue) {
                minMaxValue = value;
                minMaxValueFound = 1.0;
                minMaxPosition = ${n?s?g:x:`wR * ${m} + wC`};
              }
            }
          }
          setOutput(float(minMaxPosition));
        }
      `;return}let S="max",N=`${e}(${e}(${e}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;e==="avg"&&(N="avgValue / count");let k=Math.floor(a/4)*4,$=a%4,R=`
      if (${h}) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = ${S}(values, minMaxValue);
      }
    `;this.userCode=`
      const ivec2 strides = ivec2(${i}, ${c});
      const ivec2 pads = ivec2(${f}, ${d});
      const float initializationValue = ${b};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xR, int xC, int d) {
        if (xC < 0 || xC >= ${t.inWidth}) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xR, xC, d);
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d = coords[3];

        ivec2 xRCCorner = coords.yz * strides - pads;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // max/min x(?, ?, d) to get y(yR, yC, d).
        // ? = to be determined
        vec4 minMaxValue = vec4(${b});
        float avgValue = 0.0;
        count = 0.0;

        for (int wR = 0; wR < ${u};
            wR += ${p}) {
          int xR = xRCorner + wR;

          if (xR < 0 || xR >= ${t.inHeight}) {
            continue;
          }

          for (int wC = 0; wC < ${k}; wC += 4) {
            int xC = xCCorner + wC * ${l};

            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${l}, d),
              getValue(batch, xR, xC + 2 * ${l}, d),
              getValue(batch, xR, xC + 3 * ${l}, d)
            );

            ${R}
          }

          int xC = xCCorner + ${k};
          if (${$===1}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              initializationValue,
              initializationValue,
              initializationValue
            );

            ${R}
          } else if (${$===2}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${l}, d),
              initializationValue,
              initializationValue
            );

            ${R}
          } else if (${$===3}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${l}, d),
              getValue(batch, xR, xC + 2 * ${l}, d),
              initializationValue
            );

            ${R}
          }
        }
        setOutput(${N});
      }
    `}},vo=class{constructor(t,e,o,n=!1,s=!1){if(this.variableNames=["x"],e==="avg"&&o)throw new Error("Cannot compute positions for average pool.");let a=t.filterWidth,i=t.strideDepth,c=t.strideHeight,p=t.strideWidth,l=t.dilationDepth,u=t.dilationHeight,m=t.dilationWidth,f=t.effectiveFilterDepth,d=t.effectiveFilterHeight,h=t.effectiveFilterWidth,g=t.padInfo.front,x=t.padInfo.top,b=t.padInfo.left;this.outputShape=t.outShape;let S=e==="avg",N="0.0";if(S||(N="-1.0 / 1e-20"),o){this.userCode=`
        const ivec3 strides =
            ivec3(${i}, ${c}, ${p});
        const ivec3 pads = ivec3(${g}, ${x}, ${b});

        void main() {
          ivec5 coords = getOutputCoords();
          int batch = coords.x;
          int ch = coords.u;

          ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
          int xDCorner = xCorner.x;
          int xRCorner = xCorner.y;
          int xCCorner = xCorner.z;

          // max/min x(?, ?, ?, ch) to get y(yD, yR, yC, ch).
          // ? = to be determined
          float minMaxValue = 0.0;
          float minMaxValueFound = 0.0;
          int minMaxPosition = 0;

          for (int wD = 0; wD < ${f};
              wD += ${l}) {
            int xD = xDCorner + wD;

            if (xD < 0 || xD >= ${t.inDepth}) {
              continue;
            }

            for (int wR = 0; wR < ${d};
                wR += ${u}) {
              int xR = xRCorner + wR;

              if (xR < 0 || xR >= ${t.inHeight}) {
                continue;
              }

              for (int wC = 0; wC < ${h};
                  wC += ${m}) {
                int xC = xCCorner + wC;

                if (xC < 0 || xC >= ${t.inWidth}) {
                  continue;
                }

                float value = getX(batch, xD, xR, xC, ch);

                // If a min / max value has already been found, use it. If not,
                // use the current value.
                float currMinMaxValue = mix(
                    value, minMaxValue, minMaxValueFound);
                if (value >= currMinMaxValue) {
                  minMaxValue = value;
                  minMaxValueFound = 1.0;
                  minMaxPosition = ${n?s?`(((batch * ${t.inDepth} + xD) * ${t.inHeight} + xR) * ${t.inWidth} + xC) * ${t.inChannels} + ch`:`((xD * ${t.inHeight} + xR) * ${t.inWidth} + xC) * ${t.inChannels} + ch`:`wD * ${d} * ${h} +
                      wR * ${h} + wC`};
                }
              }
            }
          }
          setOutput(float(minMaxPosition));
        }
      `;return}let k="max",$=`${e}(${e}(${e}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;e==="avg"&&($="avgValue / count");let R=Math.floor(a/4)*4,A=a%4,D=`
      if (${S}) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = ${k}(values, minMaxValue);
      }
    `;this.userCode=`
      const ivec3 strides =
        ivec3(${i}, ${c}, ${p});
      const ivec3 pads = ivec3(${g}, ${x}, ${b});
      const float initializationValue = ${N};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xD, int xR, int xC, int ch) {
        if (xC < 0 || xC >= ${t.inWidth}) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xD, xR, xC, ch);
      }

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xDCorner = xCorner.x;
        int xRCorner = xCorner.y;
        int xCCorner = xCorner.z;

        // max/min x(?, ?, ?, d) to get y(yD, yR, yC, ch).
        // ? = to be determined
        vec4 minMaxValue = vec4(${N});
        float avgValue = 0.0;
        count = 0.0;

        for (int wD = 0; wD < ${f};
            wD += ${l}) {
          int xD = xDCorner + wD;

          if (xD < 0 || xD >= ${t.inDepth}) {
            continue;
          }

          for (int wR = 0; wR < ${d};
            wR += ${u}) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${R}; wC += 4) {
              int xC = xCCorner + wC * ${m};

              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                getValue(batch, xD, xR, xC + 2 * ${m}, ch),
                getValue(batch, xD, xR, xC + 3 * ${m}, ch)
              );

              ${D}
            }

            int xC = xCCorner + ${R};
            if (${A===1}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                initializationValue,
                initializationValue,
                initializationValue
              );

              ${D}
            } else if (${A===2}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                initializationValue,
                initializationValue
              );

              ${D}
            } else if (${A===3}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                getValue(batch, xD, xR, xC + 2 * ${m}, ch),
                initializationValue
              );

              ${D}
            }
          }
          setOutput(${$});
        }
      }
    `}};function NB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;Ar(n,"avgPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:c}=o,p=1;y.assert(I.eitherStridesOrDilationsAreOne(a,p),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${p}'`);let l=I.computePool2DInfo(n.shape,s,a,p,i,c);if(l.filterWidth===1&&l.filterHeight===1&&y.arraysEqual(l.inShape,l.outShape))return Kt({inputs:{x:n},backend:e});let u=new dr(l,"avg",!1);return e.runWebGLProgram(u,[n],"float32")}var y1={kernelName:gs,backendName:"webgl",kernelFunc:NB};function IB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dimRoundingMode:c,dataFormat:p}=o,l=[1,1,1],u=I.computePool3DInfo(n.shape,s,a,l,i,c,p),m=new vo(u,"avg",!1);return e.runWebGLProgram(m,[n],"float32")}var b1={kernelName:xs,backendName:"webgl",kernelFunc:IB};var du=class{constructor(t){this.variableNames=["dy"],this.outputShape=t.inShape;let e=t.filterHeight,o=t.filterWidth,n=t.strideHeight,s=t.strideWidth,a=t.dilationHeight,i=t.dilationWidth,c=t.effectiveFilterHeight,p=t.effectiveFilterWidth,l=c-1-t.padInfo.top,u=p-1-t.padInfo.left,m=1/(e*o);this.userCode=`
      const ivec2 pads = ivec2(${l}, ${u});
      const float avgMultiplier = float(${m});

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];

        ivec2 dyRCCorner = coords.yz - pads;
        int dyRCorner = dyRCCorner.x;
        int dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${c};
            wR += ${a}) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          for (int wC = 0; wC < ${p};
            wC+= ${i}) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            float dyValue = getDy(b, idyR, idyC, d);

            dotProd += dyValue * avgMultiplier;
          }
        }
        setOutput(dotProd);
      }
    `}},hu=class{constructor(t){this.variableNames=["dy"],this.outputShape=t.inShape;let e=t.filterDepth,o=t.filterHeight,n=t.filterWidth,s=t.strideDepth,a=t.strideHeight,i=t.strideWidth,c=t.dilationDepth,p=t.dilationHeight,l=t.dilationWidth,u=t.effectiveFilterDepth,m=t.effectiveFilterHeight,f=t.effectiveFilterWidth,d=u-1-t.padInfo.front,h=m-1-t.padInfo.top,g=f-1-t.padInfo.left,x=1/(e*o*n);this.userCode=`
      const ivec3 pads = ivec3(${d}, ${h}, ${g});
      const float avgMultiplier = float(${x});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyDCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, d) with pos mask(:, :, :, ch) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int wD = 0; wD < ${u};
            wD += ${c}) {
          float dyD = float(dyDCorner + wD) / ${s}.0;

          if (dyD < 0.0 || dyD >= ${t.outDepth}.0 || fract(dyD) > 0.0) {
            continue;
          }
          int idyD = int(dyD);

          for (int wR = 0; wR < ${m};
              wR += ${p}) {
            float dyR = float(dyRCorner + wR) / ${a}.0;

            if (dyR < 0.0 || dyR >= ${t.outHeight}.0 ||
                fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            for (int wC = 0; wC < ${f};
                wC += ${l}) {
              float dyC = float(dyCCorner + wC) / ${i}.0;

              if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              float dyValue = getDy(batch, idyD, idyR, idyC, ch);

              dotProd += dyValue * avgMultiplier;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function vB(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s,{filterSize:i,strides:c,pad:p,dimRoundingMode:l}=o,u=[1,1,1],m=I.computePool3DInfo(a.shape,i,c,u,p,l),f=new hu(m);return e.runWebGLProgram(f,[n],a.dtype)}var C1={kernelName:Wc,backendName:"webgl",kernelFunc:vB};function kB(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s;Ar([n,s],"avgPoolGrad");let{filterSize:i,strides:c,pad:p}=o,l=I.computePool2DInfo(a.shape,i,c,1,p),u=new du(l);return e.runWebGLProgram(u,[n],a.dtype)}var T1={kernelName:zc,backendName:"webgl",kernelFunc:kB};function EB(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s}=t,{transposeA:a,transposeB:i}=o;return ns({a:n,b:s,transposeA:a,transposeB:i,backend:e})}var S1={kernelName:ys,backendName:"webgl",kernelFunc:EB};var gu=class{constructor(t,e,o,n,s,a){this.outputShape=[],this.variableNames=["x","mean","variance"],I.assertAndGetBroadcastShape(t,e),I.assertAndGetBroadcastShape(t,o);let i="0.0";n!=null&&(I.assertAndGetBroadcastShape(t,n),this.variableNames.push("offset"),i="getOffsetAtOutCoords()");let c="1.0";s!=null&&(I.assertAndGetBroadcastShape(t,s),this.variableNames.push("scale"),c="getScaleAtOutCoords()"),this.outputShape=t,this.userCode=`
      void main() {
        float x = getXAtOutCoords();
        float mean = getMeanAtOutCoords();
        float variance = getVarianceAtOutCoords();
        float offset = ${i};
        float scale = ${c};
        float inv = scale * inversesqrt(variance + float(${a}));
        setOutput(dot(vec3(x, -mean, offset), vec3(inv, inv, 1)));
      }
    `}};var xu=class{constructor(t,e,o,n,s,a){this.packedInputs=!0,this.packedOutput=!0,this.variableNames=["x","mean","variance"],I.assertAndGetBroadcastShape(t,e),I.assertAndGetBroadcastShape(t,o);let i="vec4(0.0)";n!=null&&(I.assertAndGetBroadcastShape(t,n),this.variableNames.push("offset"),i="getOffsetAtOutCoords()");let c="vec4(1.0)";s!=null&&(I.assertAndGetBroadcastShape(t,s),this.variableNames.push("scale"),c="getScaleAtOutCoords()"),this.outputShape=t,this.userCode=`
      void main() {
        vec4 offset = ${i};
        vec4 scale = ${c};

        vec4 x = getXAtOutCoords();
        vec4 mean = getMeanAtOutCoords();
        vec4 variance = getVarianceAtOutCoords();

        vec4 inv = scale * inversesqrt(variance + vec4(${a}));

        setOutput((x - mean) * inv + offset);
      }
    `}};var $B=({inputs:r,backend:t,attrs:e})=>{let{x:o,mean:n,variance:s,offset:a,scale:i}=r;y.assert(n.shape.length===s.shape.length,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),y.assert(a==null||n.shape.length===a.shape.length,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),y.assert(i==null||n.shape.length===i.shape.length,()=>"Batch normalization gradient requires mean and scale to have equal ranks.");let{varianceEpsilon:c}=e;c==null&&(c=.001);let p=[o,n,s],l=null;a!=null&&(l=a.shape,p.push(a));let u=null;i!=null&&(u=i.shape,p.push(i));let m=F().getBool("WEBGL_PACK_NORMALIZATION")?new xu(o.shape,n.shape,s.shape,l,u,c):new gu(o.shape,n.shape,s.shape,l,u,c);return t.runWebGLProgram(m,p,p[0].dtype)},w1={kernelName:Us,backendName:"webgl",kernelFunc:$B};var yu=class{constructor(t){this.variableNames=["source"],this.outputShape=t,this.rank=t.length;let e=mt(this.rank);this.customUniforms=[{name:"start",arrayIndex:this.rank,type:"int"}];let o=RB(this.rank),n,s=t.map((a,i)=>`sourceLoc.${mh[i]} = start[${i}] + coords.${mh[i]};`);n=`
        ${e} sourceLoc;
        ${e} coords = getOutputCoords();
        ${s.join(`
`)}
      `,this.userCode=`
      void main() {
        ${n}
        setOutput(getSource(${o}));
      }
    `}},mh=["x","y","z","w","u","v"];function RB(r){if(r===1)return"sourceLoc";if(r<=6)return mh.slice(0,r).map(t=>"sourceLoc."+t).join(",");throw Error(`Slicing for rank ${r} is not yet supported`)}var bu=class{constructor(t){this.variableNames=["source"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t,this.rank=t.length,this.customUniforms=[{name:"start",arrayIndex:this.rank,type:"int"}];let e=mt(this.rank),o=Ht("coords",this.rank),n=Ht("sourceLoc",this.rank),s=this.rank===1?"sourceLoc":`vec2(${n.slice(-2).join()})`,a=`getChannel(getSource(${n.join()}), ${s})`,i=`
      result.x = ${a};
      if (++${o[this.rank-1]} < ${t[this.rank-1]}) {
        ++${n[this.rank-1]};
        result.y = ${a};
        --${n[this.rank-1]};
      }
    `,c=this.rank===1?"":`
      --${o[this.rank-1]};
      if (++${o[this.rank-2]} < ${t[this.rank-2]}) {
        ++${n[this.rank-2]};
        result.z = ${a};
        if (++${o[this.rank-1]} < ${t[this.rank-1]}) {
          ++${n[this.rank-1]};
          result.w = ${a};
        }
      }
    `,p=this.rank<=4?`sourceLoc = coords +
            ${e}(${t.map((l,u)=>`start[${u}]`).join()});`:t.map((l,u)=>`${n[u]} = ${o[u]} + start[${u}];`).join(`
`);this.userCode=`
      void main() {
        ${e} coords = getOutputCoords();
        ${e} sourceLoc;
        ${p}
        vec4 result = vec4(0.);
        ${i}
        ${c}
        setOutput(result);
      }
    `}};function AB(r,t,e,o){let n=o.texData.get(r.dataId),s=o.makeTensorInfo(e,r.dtype),a=o.texData.get(s.dataId);Object.assign(a,n),a.refCount=1,a.shape=e,a.dtype=r.dtype;let i=ne.computeFlatOffset(t,y.computeStrides(r.shape));n.slice&&(i+=n.slice.flatOffset),a.slice={flatOffset:i,origDataId:n.slice&&n.slice.origDataId||r.dataId};let c=o.dataRefCount.get(a.slice.origDataId)||1;return o.dataRefCount.set(a.slice.origDataId,c+1),s}function hr(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,size:a}=o,[i,c]=ne.parseSliceParams(n,s,a);if(ne.assertParamsValid(n,i,c),y.sizeFromShape(c)===0)return e.makeTensorInfo(c,n.dtype,[]);if(e.shouldExecuteOnCPU([n])||n.dtype==="string"){let u=e.texData.get(n.dataId),m=hN(u.values,i,c,n.shape,n.dtype);return e.makeTensorInfo(c,n.dtype,m)}let{isPacked:p}=e.texData.get(n.dataId),l=ne.isSliceContinous(n.shape,i,c);if(p||!l){let u=F().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new bu(c):new yu(c),m=[i];return e.runWebGLProgram(u,[n],n.dtype,m)}return e.uploadToGPU(n.dataId),AB(n,i,c,e)}var N1={kernelName:wa,backendName:"webgl",kernelFunc:hr};var FB=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,crops:a}=o;y.assert(n.shape.length<=4,()=>"batchToSpaceND for rank > 4 with a WebGL backend not implemented yet");let i=s.reduce((b,S)=>b*S),c=I.getReshaped(n.shape,s,i),p=I.getPermuted(c.length,s.length),l=I.getReshapedPermuted(n.shape,s,i),u=I.getSliceBeginCoords(a,s.length),m=I.getSliceSize(l,a,s.length),f=[],d=K({inputs:{x:n},backend:e,attrs:{shape:c}}),h=_t({inputs:{x:d},backend:e,attrs:{perm:p}}),g=K({inputs:{x:h},backend:e,attrs:{shape:l}}),x=hr({inputs:{x:g},backend:e,attrs:{begin:u,size:m}});return f.push(d),f.push(h),f.push(g),f.forEach(b=>e.disposeIntermediateTensorInfo(b)),x},I1={kernelName:bs,backendName:"webgl",kernelFunc:FB};function DB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a}=o,i=e.readSync(n.dataId),c=e.readSync(s.dataId),p=Ql(i,c,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,p)}var v1={kernelName:Cs,backendName:"webgl",kernelFunc:DB};function _B(r){let{inputs:t,backend:e}=r,{s0:o,s1:n}=t,s=e.readSync(o.dataId),a=e.readSync(n.dataId),i=I.assertAndGetBroadcastShape(Array.from(s),Array.from(a));return e.makeTensorInfo([i.length],"int32",Int32Array.from(i))}var k1={kernelName:Ts,backendName:"webgl",kernelFunc:_B};var OB="return float(a != b);",fh=Nt({opSnippet:OB,cpuKernelImpl:iN,dtype:"bool"}),E1={kernelName:an,backendName:"webgl",kernelFunc:fh};function Xr(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.texData.get(o.dataId);return Kt({inputs:{x:n.complexTensorInfos.real},backend:e})}var $1={kernelName:ha,backendName:"webgl",kernelFunc:Xr};var PB="return float(int(x));";function R1(r,t){let e=new ge(r.shape,PB),o=t.runWebGLProgram(e,[r],"int32");return{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}function dh(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dtype:s}=o;if(s==="complex64"){if(n.dtype==="complex64")return Kt({inputs:{x:n},backend:e});let a=Ye(n.shape),i=dh({inputs:{x:n},backend:e,attrs:{dtype:"float32"}}),c=ve({inputs:{real:i,imag:a},backend:e});return a.dispose(),e.disposeIntermediateTensorInfo(i),c}if(n.dtype==="complex64"){let a=Xr({inputs:{input:n},backend:e}),i=dh({inputs:{x:a},backend:e,attrs:{dtype:s}});return e.disposeIntermediateTensorInfo(a),i}if(!y.hasEncodingLoss(n.dtype,s)){let a=Kt({inputs:{x:n},backend:e});return{dataId:a.dataId,shape:a.shape,dtype:s}}if(e.shouldExecuteOnCPU([n])){let a=e.texData.get(n.dataId).values,[i,c,p]=zw(a,n.shape,n.dtype,s);return e.makeTensorInfo(i,c,p)}if(s==="int32")return R1(n,e);if(s==="bool"){let a=e.makeTensorInfo([],"bool",y.getTypedArrayFromDType("bool",1)),c=fh({inputs:{a:n,b:a},backend:e});return e.disposeIntermediateTensorInfo(a),c}throw new Error(`Error in Cast: failed to cast ${n.dtype} to ${s}`)}var A1={kernelName:ro,backendName:"webgl",kernelFunc:dh};var F1="return ceil(x);",LB=rt({opSnippet:F1,packedOpSnippet:F1,cpuKernelImpl:Ww}),D1={kernelName:Bo,backendName:"webgl",kernelFunc:LB};var Cu=class{constructor(t){this.variableNames=["A"],this.customUniforms=[{name:"minVal",type:"float"},{name:"maxVal",type:"float"}],this.outputShape=t,this.userCode=`

      void main() {
        float value = getAAtOutCoords();
        if (isnan(value)) {
          setOutput(value);
          return;
        }

        setOutput(clamp(value, minVal, maxVal));
      }
    `}};var Tu=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"minVal",type:"float"},{name:"maxVal",type:"float"}],this.outputShape=t,this.userCode=`
      void main() {
        vec4 value = getAAtOutCoords();

        if (any(isnan(value))) {
          setOutput(value);
          return;
        }

        setOutput(clamp(value, vec4(minVal), vec4(maxVal)));
      }
    `}};function BB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{clipValueMin:s,clipValueMax:a}=o,i;F().getBool("WEBGL_PACK_CLIP")?i=new Tu(n.shape):i=new Cu(n.shape);let c=[[s],[a]];return e.runWebGLProgram(i,[n],n.dtype,c)}var _1={kernelName:Vo,backendName:"webgl",kernelFunc:BB};var Su=class{constructor(t){this.variableNames=["real","imag"],this.outputShape=t,this.userCode=`
      void main() {
        float re = abs(getRealAtOutCoords());
        float im = abs(getImagAtOutCoords());
        float mx = max(re, im);

        // sadly the length function in glsl is not underflow-safe
        // (at least not on Intel GPUs). So the safe solution is
        // to ensure underflow-safety in all cases.
        setOutput(
          mx == 0.0 ? 0.0 : mx * length(vec2(1, min(re, im)/mx))
        );
      }
    `}};function O1(r,t){return{dataId:t.dataId,dtype:t.dtype,shape:r.shape}}function VB(r){let{inputs:t,backend:e}=r,{x:o}=t,n=e.texData.get(o.dataId),s=new Su(o.shape),a=[O1(o,n.complexTensorInfos.real),O1(o,n.complexTensorInfos.imag)];return e.runWebGLProgram(s,a,a[0].dtype)}var P1={kernelName:ws,backendName:"webgl",kernelFunc:VB};var wu=class{constructor(t){this.outputShape=[],this.outputShape=I.computeOutShape(t,1),this.variableNames=t.map((a,i)=>`T${i}`);let e=new Array(t.length-1);e[0]=t[0][1];for(let a=1;a<e.length;a++)e[a]=e[a-1]+t[a][1];let o=[`if (yC < ${e[0]}) setOutput(getT0(yR, yC));`];for(let a=1;a<e.length;a++){let i=e[a-1];o.push(`else if (yC < ${e[a]}) setOutput(getT${a}(yR, yC-${i}));`)}let n=e.length,s=e[e.length-1];o.push(`else setOutput(getT${n}(yR, yC-${s}));`),this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int yR = coords.x;
        int yC = coords.y;

        ${o.join(`
        `)}
      }
    `}};var Iu=class{constructor(t,e){this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[],this.outputShape=I.computeOutShape(t,e);let o=this.outputShape,n=o.length,s=mt(n),a=Ht("coords",n),i=["x","y","z","w","u","v"].slice(0,n);this.variableNames=t.map((h,g)=>`T${g}`);let c=new Array(t.length-1);c[0]=t[0][e];for(let h=1;h<c.length;h++)c[h]=c[h-1]+t[h][e];let p=i[e],l=i.slice(-2),u=i.join(),m=`if (${p} < ${c[0]}) {
        return getChannel(
            getT0(${u}), vec2(${l.join()}));
        }`;for(let h=1;h<c.length;h++){let g=c[h-1];m+=`
        if (${p} < ${c[h]}  && ${p} >= ${c[h-1]}) {
          return getChannel(
            getT${h}(${Nu(i,p,g)}),
            vec2(${Nu(l,p,g)}));
        }`}let f=c.length,d=c[c.length-1];m+=`
        return getChannel(
          getT${f}(${Nu(i,p,d)}),
          vec2(${Nu(l,p,d)}));`,this.userCode=`
      float getValue(${i.map(h=>"int "+h)}) {
        ${m}
      }

      void main() {
        ${s} coords = getOutputCoords();
        vec4 result = vec4(getValue(${a}), 0., 0., 0.);

        ${a[n-1]} = ${a[n-1]} + 1;
        if (${a[n-1]} < ${o[n-1]}) {
          result.g = getValue(${a});
        }

        ${a[n-2]} = ${a[n-2]} + 1;
        if (${a[n-2]} < ${o[n-2]}) {
          result.a = getValue(${a});
        }

        ${a[n-1]} = ${a[n-1]} - 1;
        if (${a[n-2]} < ${o[n-2]} &&
            ${a[n-1]} < ${o[n-1]}) {
          result.b = getValue(${a});
        }
        setOutput(result);
      }
    `}};function Nu(r,t,e){let o=r.indexOf(t);return r.map((s,a)=>a===o?`${s} - ${e}`:s).join()}function ss(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.texData.get(o.dataId);return Kt({inputs:{x:n.complexTensorInfos.imag},backend:e})}var L1={kernelName:Xs,backendName:"webgl",kernelFunc:ss};function vi(r,t,e){let o=r[0].dtype;if(o==="complex64"){let u=r.map(g=>Xr({inputs:{input:g},backend:e})),m=r.map(g=>ss({inputs:{input:g},backend:e})),f=vi(u,t,e),d=vi(m,t,e),h=ve({inputs:{real:f,imag:d},backend:e});return u.forEach(g=>e.disposeIntermediateTensorInfo(g)),m.forEach(g=>e.disposeIntermediateTensorInfo(g)),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),h}let n=e.shouldExecuteOnCPU(r);if(o==="string"&&(n=!0),n){let u=r.map(b=>{let N=[-1,y.sizeFromShape(b.shape.slice(t))];return K({inputs:{x:b},backend:e,attrs:{shape:N}})}),m=u.map(b=>({vals:e.readSync(b.dataId),shape:b.shape})),f=I.computeOutShape(u.map(b=>b.shape),1),d=u[0].shape[0]===1,h=Gw(m,f,o,d),g=I.computeOutShape(r.map(b=>b.shape),t),x=e.makeTensorInfo(g,o,h);return u.forEach(b=>e.disposeIntermediateTensorInfo(b)),x}let s=F().getNumber("WEBGL_MAX_TEXTURES_IN_SHADER");if(r.length>s){let u=[];for(let f=0;f<r.length;f+=s){let d=r.slice(f,f+s);u.push(vi(d,t,e))}let m=vi(u,t,e);for(let f of u)e.disposeIntermediateTensorInfo(f);return m}if(F().getBool("WEBGL_PACK_ARRAY_OPERATIONS")&&r[0].shape.length>1){let u=new Iu(r.map(m=>m.shape),t);return e.runWebGLProgram(u,r,o)}let{tensors2D:a,outShape:i}=MB(r,t,e),c=new wu(a.map(u=>u.shape)),p=e.runWebGLProgram(c,a,o);a.forEach(u=>e.disposeIntermediateTensorInfo(u));let l=K({inputs:{x:p},attrs:{shape:i},backend:e});return e.disposeIntermediateTensorInfo(p),l}function MB(r,t,e){let o=I.computeOutShape(r.map(s=>s.shape),t);return{tensors2D:r.map(s=>K({inputs:{x:s},attrs:{shape:[-1,y.sizeFromShape(s.shape.slice(t))]},backend:e})),outShape:o}}function hh(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o,s=y.parseAxisParam(n,t[0].shape)[0],a=t.map(p=>p.shape);I.assertParamsConsistent(a,s);let i=I.computeOutShape(t.map(p=>p.shape),s);if(y.sizeFromShape(i)===0)return e.makeTensorInfo(i,t[0].dtype,[]);let c=t.filter(p=>y.sizeFromShape(p.shape)>0);return c.length===1?Kt({inputs:{x:c[0]},backend:e}):vi(c,s,e)}var B1={kernelName:Ns,backendName:"webgl",kernelFunc:hh};var ki=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.outputShape=t.outShape;let a=t.padInfo.top,i=t.padInfo.left,c=t.strideHeight,p=t.strideWidth,l=t.dilationHeight,u=t.dilationWidth,m=t.filterHeight,f=t.filterWidth,d=Math.floor(t.inChannels/4)*4,h=t.inChannels%4,g=t.dataFormat==="channelsLast",x=g?1:2,b=g?2:3,S=g?3:1,N="",k="";o&&(n?N=`float activation(float a) {
          float b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?N=`float activation(float a) {
          float b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:N=`
          float activation(float x) {
            ${o}
          }
        `,k="result = activation(result);");let $=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${N}

      const ivec2 strides = ivec2(${c}, ${p});
      const ivec2 pads = ivec2(${a}, ${i});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d2 = coords[${S}];

        ivec2 xRCCorner =
            ivec2(coords[${x}], coords[${b}]) * strides - pads;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // Convolve x(?, ?, d1) with w(:, :, d1, d2) to get y(yR, yC, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${m}; wR++) {
          int xR = xRCorner + wR * ${l};

          if (xR < 0 || xR >= ${t.inHeight}) {
            continue;
          }

          for (int wC = 0; wC < ${f}; wC++) {
            int xC = xCCorner + wC * ${u};

            if (xC < 0 || xC >= ${t.inWidth}) {
              continue;
            }

            for (int d1 = 0; d1 < ${d}; d1 += 4) {
              vec4 wValues = vec4(
                getW(wR, wC, d1, d2),
                getW(wR, wC, d1 + 1, d2),
                getW(wR, wC, d1 + 2, d2),
                getW(wR, wC, d1 + 3, d2)
              );

              if (${g}) {
                vec4 xValues = vec4(
                  getX(batch, xR, xC, d1),
                  getX(batch, xR, xC, d1 + 1),
                  getX(batch, xR, xC, d1 + 2),
                  getX(batch, xR, xC, d1 + 3)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec4 xValues = vec4(
                  getX(batch, d1, xR, xC),
                  getX(batch, d1 + 1, xR, xC),
                  getX(batch, d1 + 2, xR, xC),
                  getX(batch, d1 + 3, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }
            }

            if (${h===1}) {

              if (${g}) {
                dotProd +=
                    getX(batch, xR, xC, ${d}) *
                    getW(wR, wC, ${d}, d2);
              } else {
                dotProd +=
                    getX(batch, ${d}, xR, xC) *
                    getW(wR, wC, ${d}, d2);
              }

            } else if (${h===2}) {
              vec2 wValues = vec2(
                getW(wR, wC, ${d}, d2),
                getW(wR, wC, ${d} + 1, d2)
              );

              if (${g}) {
                vec2 xValues = vec2(
                  getX(batch, xR, xC, ${d}),
                  getX(batch, xR, xC, ${d} + 1)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec2 xValues = vec2(
                  getX(batch, ${d}, xR, xC),
                  getX(batch, ${d} + 1, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }

            } else if (${h===3}) {
              vec3 wValues = vec3(
                getW(wR, wC, ${d}, d2),
                getW(wR, wC, ${d} + 1, d2),
                getW(wR, wC, ${d} + 2, d2)
              );

              if (${g}) {
                vec3 xValues = vec3(
                  getX(batch, xR, xC, ${d}),
                  getX(batch, xR, xC, ${d} + 1),
                  getX(batch, xR, xC, ${d} + 2)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec3 xValues = vec3(
                  getX(batch, ${d}, xR, xC),
                  getX(batch, ${d} + 1, xR, xC),
                  getX(batch, ${d} + 2, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }

            }
          }
        }

        float result = dotProd;
        ${$}
        ${k}
        setOutput(result);
      }
    `}},vu=class{constructor(t){this.variableNames=["x","W"],this.outputShape=t.outShape;let e=t.padInfo.front,o=t.padInfo.top,n=t.padInfo.left,s=t.strideDepth,a=t.strideHeight,i=t.strideWidth,c=t.dilationDepth,p=t.dilationHeight,l=t.dilationWidth,u=t.filterDepth,m=t.filterHeight,f=t.filterWidth,d=Math.floor(t.inChannels/4)*4,h=t.inChannels%4;this.userCode=`
      const ivec3 strides = ivec3(${s}, ${a}, ${i});
      const ivec3 pads = ivec3(${e}, ${o}, ${n});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int d2 = coords.u;

        ivec3 xFRCCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xFCorner = xFRCCorner.x;
        int xRCorner = xFRCCorner.y;
        int xCCorner = xFRCCorner.z;

        // Convolve x(?, ?, ?, d1) with w(:, :, :, d1, d2) to get
        // y(yF, yR, yC, d2). ? = to be determined. : = across all
        // values in that axis.
        float dotProd = 0.0;
        for (int wF = 0; wF < ${u}; wF++) {
          int xF = xFCorner + wF * ${c};

          if (xF < 0 || xF >= ${t.inDepth}) {
            continue;
          }

          for (int wR = 0; wR < ${m}; wR++) {
            int xR = xRCorner + wR * ${p};

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${f}; wC++) {
              int xC = xCCorner + wC * ${l};

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              for (int d1 = 0; d1 < ${d}; d1 += 4) {
                vec4 xValues = vec4(
                  getX(batch, xF, xR, xC, d1),
                  getX(batch, xF, xR, xC, d1 + 1),
                  getX(batch, xF, xR, xC, d1 + 2),
                  getX(batch, xF, xR, xC, d1 + 3)
                );
                vec4 wValues = vec4(
                  getW(wF, wR, wC, d1, d2),
                  getW(wF, wR, wC, d1 + 1, d2),
                  getW(wF, wR, wC, d1 + 2, d2),
                  getW(wF, wR, wC, d1 + 3, d2)
                );

                dotProd += dot(xValues, wValues);
              }

              if (${h===1}) {
                dotProd +=
                  getX(batch, xF, xR, xC, ${d}) *
                  getW(wF, wR, wC, ${d}, d2);
              } else if (${h===2}) {
                vec2 xValues = vec2(
                  getX(batch, xF, xR, xC, ${d}),
                  getX(batch, xF, xR, xC, ${d} + 1)
                );
                vec2 wValues = vec2(
                  getW(wF, wR, wC, ${d}, d2),
                  getW(wF, wR, wC, ${d} + 1, d2)
                );
                dotProd += dot(xValues, wValues);
              } else if (${h===3}) {
                vec3 xValues = vec3(
                  getX(batch, xF, xR, xC, ${d}),
                  getX(batch, xF, xR, xC, ${d} + 1),
                  getX(batch, xF, xR, xC, ${d} + 2)
                );
                vec3 wValues = vec3(
                  getW(wF, wR, wC, ${d}, d2),
                  getW(wF, wR, wC, ${d} + 1, d2),
                  getW(wF, wR, wC, ${d} + 2, d2)
                );
                dotProd += dot(xValues, wValues);
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}};var Ei=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=t.outShape,this.enableShapeUniforms=$t(this.outputShape.length);let a=t.padInfo.left,i=t.strideWidth,c=t.dilationWidth,p=t.filterHeight,l=t.filterWidth,u=l,m=`
       int xR; int xC; int xCOffset;
       vec4 wTexel; vec4 previous; vec4 final;`;for(let g=0;g<l;g++)m+=`
           vec4 xTexelC${g*2};
           int xTexelC${g*2}Ready;
           vec4 xTexelC${g*2+1};
           int xTexelC${g*2+1}Ready;
           vec4 xC${g};`;m+=`
     for (int r = 0; r < ${p}; r++) {
      for (int d1 = 0; d1 < ${t.inChannels}; d1 += 2) {
       `;for(let g=0;g<l;g++)m+=`
           xTexelC${g*2} = vec4(0.0);
           xTexelC${g*2}Ready = 0;
           xTexelC${g*2+1} = vec4(0.0);
           xTexelC${g*2+1}Ready = 0;
           xC${g} = vec4(0.0);`;m+=`
         xR = xRCorner + r * dilations[0];
         if (xR >=0 && xR < inDims[0]) {
       `;for(let g=0;g<(u+1)/2;g++){let x=g*2;if(m+=`
           xC = xCCorner + ${x*c};
           `,i===1){if(x<l&&(a%2===1?(m+=`
                 xCOffset = xC + 1;
                 if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xCOffset, d1);

                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }
               `,c===1&&x>0?m+=`
                 xC${x} = vec4(xTexelC${x-2}.zw, xTexelC${x}.xy);
                 `:m+=`
                   xCOffset = xC + 1 - 2;

                   if (xCOffset >= 0 && xCOffset < inDims[1]) {
                     previous = getX(batch, xR, xCOffset, d1);

                     // Need to manually clear unused channels in case
                     // we're reading from recycled texture.
                     if (xCOffset + 1 >= inDims[1]) {
                       previous.zw = vec2(0.0);
                     }

                     xC${x} = vec4(previous.zw, xTexelC${x}.xy);
                   } else {
                     xC${x} = vec4(0.0, 0.0, xTexelC${x}.xy);
                   }
                   `):m+=`
                 if (xC >= 0 && xC < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xC, d1);
                   if (xC + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }

                 xC${x} = xTexelC${x};
                 `,x+1<l)){let b=a%2===0?y.nearestLargerEven(c):c;c%2===0&&a%2===1||c%2!==0&&a%2!==1?(m+=`
                   xCOffset = xC + imod(pads[1], 2) + ${b};

                   if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x+1}Ready == 0) {
                     xTexelC${x+1} = getX(batch, xR, xCOffset, d1);

                     // Need to manually clear unused channels in case
                     // we're reading from recycled texture.
                     if (xCOffset + 1 >= inDims[1]) {
                       xTexelC${x+1}.zw = vec2(0.0);
                     }
                     xTexelC${x+1}Ready = 1;
                   }
                   `,c>1?m+=`
                     xCOffset -= 2;
                     if (xCOffset >= 0 && xCOffset < inDims[1]) {
                      previous = getX(batch, xR, xCOffset, d1);
                      xC${x+1} = vec4(previous.zw, xTexelC${x+1}.xy);
                     } else {
                      xC${x+1} = vec4(0.0, 0.0, xTexelC${x+1}.xy);
                     }
                     `:m+=`
                     xC${x+1} = vec4(xTexelC${x}.zw, xTexelC${x+1}.xy);
                     `):b===1?m+=`
                     xC${x+1} = xTexelC${x};
                     `:m+=`
                     xCOffset = xC + ${b};

                     if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x+1}Ready == 0) {
                       xTexelC${x+1} = getX(batch, xR, xCOffset, d1);
                       if (xCOffset + 1 >= inDims[1]) {
                         xTexelC${x+1}.zw = vec2(0.0);
                       }
                       xTexelC${x+1}Ready = 1;
                     }

                     xC${x+1} = xTexelC${x+1};
                     `}}else x<l&&(a%2===1?(m+=`
                 xCOffset = xC + 1 - strides[1];
                 if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xCOffset, d1);
                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }

                 if(xC + 1 >= 0 && xC + 1 < inDims[1] && xTexelC${x+1}Ready == 0) {
                   xTexelC${x+1} = getX(batch, xR, xC + 1, d1);
                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xC + 2 >= inDims[1]) {
                     xTexelC${x+1}.zw = vec2(0.0);
                   }
                   xTexelC${x+1}Ready = 1;
                 }

                 xC${x} = vec4(xTexelC${x}.zw, xTexelC${x+1}.zw);
               `,x+1<l&&(m+=`
                   final = vec4(0.0);
                   xCOffset = xC + 1 + strides[1];
                   if(xCOffset >= 0 && xCOffset < inDims[1]) {
                     final = getX(batch, xR, xCOffset, d1);
                   }
                   xC${x+1} = vec4(xTexelC${x+1}.xy, final.xy);
                 `)):(m+=`
                 if(xC >= 0 && xC < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xC, d1);
                   if (xC + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }

                 xCOffset = xC + strides[1];
                 if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x+1}Ready == 0) {
                   xTexelC${x+1} = getX(batch, xR, xCOffset, d1);
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${x+1}.zw = vec2(0.);
                   }
                   xTexelC${x+1}Ready = 1;
                 }

                 xC${x} = vec4(
                   xTexelC${x}.xy, xTexelC${x+1}.xy);
               `,x+1<l&&(m+=`
                   xC${x+1} = vec4(xTexelC${x}.zw, xTexelC${x+1}.zw);
                 `)));x<l&&(m+=`
             wTexel = getW(r, ${x}, d1, d2);
             dotProd += xC${x}.xxzz * vec4(wTexel.xy, wTexel.xy);
             if(d1 + 1 < ${t.inChannels}) {
               dotProd += xC${x}.yyww * vec4(wTexel.zw, wTexel.zw);
             }
           `,x+1<l&&(m+=`
               wTexel = getW(r, ${x+1}, d1, d2);
               dotProd += xC${x+1}.xxzz * vec4(wTexel.xy, wTexel.xy);
               if(d1 + 1 < ${t.inChannels}) {
                 dotProd += xC${x+1}.yyww * vec4(wTexel.zw, wTexel.zw);
               }
             `))}m+=`
     }
   `,m+=`
     }
   `,m+=`
     }
   `;let f="",d="";o&&(n?f=`vec4 activation(vec4 a) {
           vec4 b = getPreluActivationWeightsAtOutCoords();
           ${o}
         }`:s?f=`vec4 activation(vec4 a) {
           vec4 b = getLeakyreluAlphaAtOutCoords();
           ${o}
         }`:f=`vec4 activation(vec4 x) {
           ${o}
         }`,d="result = activation(result);");let h=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
       ${f}

       void main() {
         ivec4 coords = getOutputCoords();
         int batch = coords.x;
         ivec2 xRCCorner = coords.yz * strides - pads;
         int d2 = coords.w;
         int xRCorner = xRCCorner.x;
         int xCCorner = xRCCorner.y;

         //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
         vec4 dotProd = vec4(0.000000000000001);

         ${m}

         vec4 result = dotProd - vec4(0.000000000000001);
         ${h}
         ${d}
         setOutput(result);
       }
     `}};var ku=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"inputShape",type:"ivec4"},{name:"pad",type:"ivec2"},{name:"stride",type:"ivec2"},{name:"dilation",type:"ivec2"},{name:"inChannels",type:"int"},{name:"itemsPerBlockRow",type:"int"},{name:"outWidth",type:"int"}],this.outputShape=t,this.enableShapeUniforms=$t(this.outputShape.length);let{dataFormat:o}=e,n=Vt(),s=o==="channelsLast",a=s?1:2,i=s?2:3,c=this.enableShapeUniforms?"if(blockIndex < outShape[2] && pos < outShape[1]) {":`if(blockIndex < ${t[2]} && pos < ${t[1]}) {`,p="";for(let l=0;l<=1;l++)for(let u=0;u<=1;u++)p+=`
          blockIndex = rc.z + ${u};
          pos = rc.y + ${l};

          ${c}
            offsetY = int(blockIndex / outWidth) * stride[0] - pad[0];
            d0 = offsetY + dilation[0] * (pos / itemsPerBlockRow);

            if(d0 < inputShape[${a}] && d0 >= 0) {
              // Use custom imod instead mod. On Intel GPU, mod may generate
              // unexpected value.
              // https://github.com/tensorflow/tfjs/issues/5447
              offsetX = imod(blockIndex, outWidth) * stride[1] - pad[1];
              d1 = offsetX + dilation[1] * (imod(pos, itemsPerBlockRow) /
                  inChannels);

              if(d1 < inputShape[${i}] && d1 >= 0) {

                ch = imod(pos, inChannels);

                if (${s}) {
                  innerDims = vec2(d1, ch);
                  result[${l*2+u}] = getChannel(
                    getA(rc.x, d0, int(innerDims.x),
                    int(innerDims.y)), innerDims);
                } else {
                  innerDims = vec2(d0, d1);
                  result[${l*2+u}] = getChannel(
                    getA(rc.x, ch, int(innerDims.x),
                    int(innerDims.y)), innerDims);
                }
              }
            }
          }
        `;this.userCode=`
      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0);

        int blockIndex, pos, offsetY, d0, offsetX, d1, ch;
        vec2 innerDims;

        ${p}

        ${n.output} = result;
      }
    `}};function Eu(r,t){let e=r.length;return e>=3?t?[...r.slice(0,-3),r[e-3]*r[e-2],r[e-1]]:[...r.slice(0,-3),r[e-3],r[e-2]*r[e-1]]:!t&&e===1&&r[0]>1?[r[0],1]:null}function $u({x:r,filter:t,convInfo:e,backend:o,bias:n=null,preluActivationWeights:s=null,leakyreluAlpha:a=0,activation:i=null}){let c=r.shape,p=o.texData.get(r.dataId),l=e.inChannels,u=c[0]*c[1]*c[2],m=e.outChannels,f=e.dataFormat==="channelsLast",d=!1,h=!1,g,x=[];if(s!=null){let N=Eu(s.shape,f);N!=null&&(s=K({inputs:{x:s},backend:o,attrs:{shape:N}}),x.push(s))}if(n!=null){let N=Eu(n.shape,f);N!=null&&(n=K({inputs:{x:n},backend:o,attrs:{shape:N}}),x.push(n))}if(!((u===1||m===1)&&l>uh)&&p.isPacked&&f&&p.texture!=null&&c[2]%2!==0&&y.arraysEqual(p.shape.slice(-3),c.slice(-3))){let N=c[0]*c[1]*(c[2]+1),k={dataId:r.dataId,shape:[1,N,e.inChannels],dtype:r.dtype},$=p.shape;p.shape=p.shape.slice(),p.shape[p.shape.length-2]++,y.assert(Qn(p.shape,k.shape),()=>`packed reshape ${p.shape} to ${k.shape} isn't free`);let R=K({inputs:{x:t},backend:o,attrs:{shape:[1,e.inChannels,e.outChannels]}});x.push(R);let A=ns({a:k,b:R,backend:o,transposeA:d,transposeB:h,bias:n,activation:i,preluActivationWeights:s,leakyreluAlpha:a}),D=o.texData.get(A.dataId);y.assert(D.isPacked,()=>"batchMatMul result is expected to be packed"),p.shape=$,D.shape=e.outShape,g=Kt({inputs:{x:A},backend:o}),g.shape=e.outShape,x.push(A)}else{let N=e.outHeight*e.outWidth,k=K({inputs:{x:r},backend:o,attrs:{shape:f?[e.batchSize,N,e.inChannels]:[e.batchSize,e.inChannels,N]}}),$=K({inputs:{x:t},backend:o,attrs:{shape:[1,e.inChannels,e.outChannels]}}),R=ns({a:f?k:$,b:f?$:k,transposeA:!f,transposeB:h,backend:o,bias:n,activation:i,preluActivationWeights:s,leakyreluAlpha:a});g=K({inputs:{x:R},backend:o,attrs:{shape:e.outShape}}),x.push(k),x.push($),x.push(R)}for(let N of x)o.disposeIntermediateTensorInfo(N);return g}function Ru({x:r,filter:t,convInfo:e,backend:o,bias:n=null,preluActivationWeights:s=null,leakyreluAlpha:a=0,activation:i=null}){let{filterWidth:c,filterHeight:p,inChannels:l,outWidth:u,outHeight:m,dataFormat:f}=e,d=f==="channelsLast",h=c*p*l,g=m*u,x=[e.batchSize,h,g],b=!0,S=!1,N=[];if(s!=null){let z=Eu(s.shape,d);z!=null&&(s=K({inputs:{x:s},backend:o,attrs:{shape:z}}),N.push(s))}if(n!=null){let z=Eu(n.shape,d);z!=null&&(n=K({inputs:{x:n},backend:o,attrs:{shape:z}}),N.push(n))}let k=K({inputs:{x:t},backend:o,attrs:{shape:[1,h,y.sizeFromShape(t.shape)/h]}});N.push(k);let $=new ku(x,e),R=[r.shape,[e.padInfo.top,e.padInfo.left],[e.strideHeight,e.strideWidth],[e.dilationHeight,e.dilationWidth],[e.inChannels],[e.filterWidth*e.inChannels],[e.outWidth]],A=o.runWebGLProgram($,[r],"float32",R),D=K({inputs:{x:A},backend:o,attrs:{shape:x}});N.push(A),N.push(D);let _=n!=null,O=s!=null,L=i==="leakyrelu",B=i?qr(i,!0):null,M=new Ii(d?D.shape:k.shape,d?k.shape:D.shape,d?[e.batchSize,g,e.outChannels]:[e.batchSize,e.outChannels,g],b,S,_,B,O,L),V=d?[D,k]:[k,D];if(n&&V.push(n),O&&V.push(s),L){let z=o.makeTensorInfo([],"float32",y.createScalarValue(a,"float32"));V.push(z),N.push(z)}let G=o.runWebGLProgram(M,V,"float32"),U=K({inputs:{x:G},backend:o,attrs:{shape:e.outShape}});N.push(G);for(let z of N)o.disposeIntermediateTensorInfo(z);return U}function zB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dataFormat:c,dilations:p,dimRoundingMode:l}=o,u=I.convertConv2DDataFormat(c),m=I.computeConv2DInfo(n.shape,s.shape,a,p,i,l,!1,u),f;if(m.filterHeight===1&&m.filterWidth===1&&m.dilationHeight===1&&m.dilationWidth===1&&m.strideHeight===1&&m.strideWidth===1&&(m.padInfo.type==="SAME"||m.padInfo.type==="VALID"))f=$u({x:n,filter:s,convInfo:m,backend:e});else if(m.strideWidth<=2&&u==="channelsLast"&&F().getBool("WEBGL_EXP_CONV")){let h=new Ei(m),g=[[m.padInfo.top,m.padInfo.left],[m.strideHeight,m.strideWidth],[m.dilationHeight,m.dilationWidth],[m.inHeight,m.inWidth]];f=e.runWebGLProgram(h,[n,s],"float32",g)}else if(F().getBool("WEBGL_CONV_IM2COL"))f=Ru({x:n,filter:s,convInfo:m,backend:e});else{let h=new ki(m);f=e.runWebGLProgram(h,[n,s],"float32")}let d=K({inputs:{x:f},backend:e,attrs:{shape:m.outShape}});return e.disposeIntermediateTensorInfo(f),d}var V1={kernelName:Is,backendName:"webgl",kernelFunc:zB};var Au=class{constructor(t){this.variableNames=["x","dy"],this.outputShape=t.filterShape;let e=t.strideHeight,o=t.strideWidth,n=t.padInfo.top,s=t.padInfo.left,a=t.dataFormat==="channelsLast";this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int wR = coords.x;
        int wC = coords.y;
        int d1 = coords.z;
        int d2 = coords.w;

        // Convolve x(?, ?, d1) with dy(:, :, d2) to get dw(wR, wC, d1, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int b = 0; b < ${t.batchSize}; b++) {
          for (int yR = 0; yR < ${t.outHeight}; yR++) {
            int xR = wR + yR * ${e} - ${n};

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int yC = 0; yC < ${t.outWidth}; yC++) {
              int xC = wC + yC * ${o} - ${s};

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              if (${a}) {
                float dyValue = getDy(b, yR, yC, d2);
                float xValue = getX(b, xR, xC, d1);
                dotProd += (xValue * dyValue);
              } else {
                float dyValue = getDy(b, d2, yR, yC);
                float xValue = getX(b, d1, xR, xC);
                dotProd += (xValue * dyValue);
              }

            }
          }
        }
        setOutput(dotProd);
      }
    `}},Fu=class{constructor(t){this.variableNames=["dy","W"],this.outputShape=t.inShape;let e=t.filterHeight,o=t.filterWidth,n=t.strideHeight,s=t.strideWidth,a=t.dataFormat==="channelsLast",i=e-1-t.padInfo.top,c=o-1-t.padInfo.left,p=a?1:2,l=a?2:3,u=a?3:1;this.userCode=`
      const ivec2 pads = ivec2(${i}, ${c});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[${u}];

        ivec2 dyCorner = ivec2(coords[${p}], coords[${l}]) - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${e}; wR++) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          int wRPerm = ${e} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            int wCPerm = ${o} - 1 - wC;

            for (int d2 = 0; d2 < ${t.outChannels}; d2++) {

              if (${a}) {
                float xValue = getDy(batch, idyR, idyC, d2);
                float wValue = getW(wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              } else {
                float xValue = getDy(batch, d2, idyR, idyC);
                float wValue = getW(wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }

            }
          }
        }
        setOutput(dotProd);
      }
    `}},Du=class{constructor(t){this.variableNames=["x","dy"],this.outputShape=t.filterShape;let e=t.strideDepth,o=t.strideHeight,n=t.strideWidth,s=t.padInfo.front,a=t.padInfo.top,i=t.padInfo.left;this.userCode=`
      void main() {
        ivec5 coords = getOutputCoords();
        int wF = coords.x;
        int wR = coords.y;
        int wC = coords.z;
        int d1 = coords.w;
        int d2 = coords.u;

        float dotProd = 0.0;

        for (int b = 0; b < ${t.batchSize}; b++) {
          for (int yF = 0; yF < ${t.outDepth}; yF++) {
            int xF = wF + yF * ${e} - ${s};

            if (xF < 0 || xF >= ${t.inDepth}) {
              continue;
            }

            for (int yR = 0; yR < ${t.outHeight}; yR++) {
              int xR = wR + yR * ${o} - ${a};

              if (xR < 0 || xR >= ${t.inHeight}) {
                continue;
              }

              for (int yC = 0; yC < ${t.outWidth}; yC++) {
                int xC = wC + yC * ${n} - ${i};

                if (xC < 0 || xC >= ${t.inWidth}) {
                  continue;
                }

                float dyValue = getDy(b, yF, yR, yC, d2);
                float xValue = getX(b, xF, xR, xC, d1);
                dotProd += (xValue * dyValue);
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}},_u=class{constructor(t){this.variableNames=["dy","W"],this.outputShape=t.inShape;let e=t.filterDepth,o=t.filterHeight,n=t.filterWidth,s=t.strideDepth,a=t.strideHeight,i=t.strideWidth,c=e-1-t.padInfo.front,p=o-1-t.padInfo.top,l=n-1-t.padInfo.left;this.userCode=`
      const ivec3 pads = ivec3(${c}, ${p}, ${l});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int d1 = coords.u;


        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyFCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        float dotProd = 0.0;
        for (int wF = 0; wF < ${e}; wF++) {
          float dyF = float(dyFCorner + wF) / ${s}.0;

          if (dyF < 0.0 || dyF >= ${t.outDepth}.0 || fract(dyF) > 0.0) {
            continue;
          }
          int idyF = int(dyF);

          int wFPerm = ${e} - 1 - wF;

          for (int wR = 0; wR < ${o}; wR++) {
            float dyR = float(dyRCorner + wR) / ${a}.0;

            if (dyR < 0.0 || dyR >= ${t.outHeight}.0 ||
              fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            int wRPerm = ${o} - 1 - wR;

            for (int wC = 0; wC < ${n}; wC++) {
              float dyC = float(dyCCorner + wC) / ${i}.0;

              if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              int wCPerm = ${n} - 1 - wC;

              for (int d2 = 0; d2 < ${t.outChannels}; d2++) {
                float xValue = getDy(batch, idyF, idyR, idyC, d2);
                float wValue = getW(wFPerm, wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function WB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,dataFormat:c,dimRoundingMode:p,filterShape:l}=o,u=I.convertConv2DDataFormat(c),m=I.computeConv2DInfo(n.shape,l,a,1,i,p,!1,u),f=new Au(m);return e.runWebGLProgram(f,[n,s],"float32")}var M1={kernelName:vs,backendName:"webgl",kernelFunc:WB};function GB(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{inputShape:a,strides:i,pad:c,dataFormat:p,dimRoundingMode:l}=o,u=I.convertConv2DDataFormat(p),m=I.computeConv2DInfo(a,s.shape,i,1,c,l,!1,u),f=new Fu(m);return e.runWebGLProgram(f,[n,s],"float32")}var z1={kernelName:ks,backendName:"webgl",kernelFunc:GB};function UB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:c}=o,p=I.computeConv3DInfo(n.shape,s.shape,a,c,i),l=new vu(p);return e.runWebGLProgram(l,[n,s],"float32")}var W1={kernelName:Es,backendName:"webgl",kernelFunc:UB};function HB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,filterShape:c}=o,p=I.computeConv3DInfo(n.shape,c,a,1,i),l=new Du(p);return e.runWebGLProgram(l,[n,s],"float32")}var G1={kernelName:Gc,backendName:"webgl",kernelFunc:HB};function KB(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{pad:a,strides:i,inputShape:c}=o,p=I.computeConv3DInfo(c,s.shape,i,1,a),l=new _u(p);return e.runWebGLProgram(l,[n,s],"float32")}var U1={kernelName:$s,backendName:"webgl",kernelFunc:KB};var qB=nr+`
  return cos(x);
`,XB=rt({opSnippet:qB}),H1={kernelName:"Cos",backendName:"webgl",kernelFunc:XB};var jB=`
  float e2x = exp(-x);
  return (e2x + 1.0 / e2x) / 2.0;
`,YB=rt({opSnippet:jB}),K1={kernelName:Mo,backendName:"webgl",kernelFunc:YB};var Ou=class{constructor(t,e,o,n,s){this.variableNames=["Image","Boxes","BoxInd"],this.outputShape=[];let[a,i,c,p]=t,[l]=e,[u,m]=o;this.outputShape=[l,u,m,p];let f=n==="bilinear"?1:0,[d,h]=[`${i-1}.0`,`${c-1}.0`],[g,x,b]=u>1?[`${(i-1)/(u-1)}`,"(y2-y1) * height_ratio",`y1*${d} + float(y)*(height_scale)`]:["0.0","0.0",`0.5 * (y1+y2) * ${d}`],[S,N,k]=m>1?[`${(c-1)/(m-1)}`,"(x2-x1) * width_ratio",`x1*${h} + float(x)*(width_scale)`]:["0.0","0.0",`0.5 * (x1+x2) * ${h}`];this.userCode=`
      const float height_ratio = float(${g});
      const float width_ratio = float(${S});
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int y = coords[1];
        int x = coords[2];
        int d = coords[3];

        // get box vals
        float y1 = getBoxes(b,0);
        float x1 = getBoxes(b,1);
        float y2 = getBoxes(b,2);
        float x2 = getBoxes(b,3);

        // get image in batch index
        int bInd = round(getBoxInd(b));
        if(bInd < 0 || bInd >= ${a}) {
          return;
        }

        float height_scale = ${x};
        float width_scale = ${N};

        float in_y = ${b};
        if( in_y < 0.0 || in_y > ${d} ) {
          setOutput(float(${s}));
          return;
        }
        float in_x = ${k};
        if( in_x < 0.0 || in_x > ${h} ) {
          setOutput(float(${s}));
          return;
        }

        vec2 sourceFracIndexCR = vec2(in_x,in_y);
        if(${f} == 1) {
          // Compute the four integer indices.
          ivec2 sourceFloorCR = ivec2(sourceFracIndexCR);
          ivec2 sourceCeilCR = ivec2(ceil(sourceFracIndexCR));

          float topLeft = getImage(b, sourceFloorCR.y, sourceFloorCR.x, d);
          float bottomLeft = getImage(b, sourceCeilCR.y, sourceFloorCR.x, d);
          float topRight = getImage(b, sourceFloorCR.y, sourceCeilCR.x, d);
          float bottomRight = getImage(b, sourceCeilCR.y, sourceCeilCR.x, d);

          vec2 fracCR = sourceFracIndexCR - vec2(sourceFloorCR);

          float top = topLeft + (topRight - topLeft) * fracCR.x;
          float bottom = bottomLeft + (bottomRight - bottomLeft) * fracCR.x;
          float newValue = top + (bottom - top) * fracCR.y;
          setOutput(newValue);
        } else {
          // Compute the coordinators of nearest neighbor point.
          ivec2 sourceNearestCR = ivec2(floor(
            sourceFracIndexCR + vec2(0.5,0.5)));
          float newValue = getImage(b, sourceNearestCR.y, sourceNearestCR.x, d);
          setOutput(newValue);
        }
      }
    `}};var ZB=r=>{let{inputs:t,backend:e,attrs:o}=r,{image:n,boxes:s,boxInd:a}=t,{cropSize:i,method:c,extrapolationValue:p}=o,l=new Ou(n.shape,s.shape,i,c,p);return e.runWebGLProgram(l,[n,s,a],"float32")},q1={kernelName:Fs,backendName:"webgl",kernelFunc:ZB};var as;(function(r){r.Prod="*",r.Sum="+"})(as||(as={}));var Rc=class{constructor(t,e,o,n){this.op=t,this.outputShape=e,this.variableNames=["x"],this.customUniforms=[{name:"index",type:"float"}];let s=this.outputShape.length,a=this.op===as.Prod?"1.0":"0.0",i=o?a:`getX(${X1(s,"coords",this.op)})`,c=this.outputShape[this.outputShape.length-1],p="",l="";o?(p=n?`end != ${c-1}`:"end != 0",l=n?"end + 1":"end - 1"):(p=n?`end + pow2 < ${c}`:"end >= pow2",l=n?"end + pow2":"end - pow2"),this.userCode=`
      void main() {
        ${mt(s)} coords = getOutputCoords();
        int end = ${j1(s,"coords",this.op)};
        float val = ${i};
        int pow2 = int(pow(2.0, index));
        if (${p}) {
          int idx = ${l};
          ${j1(s,"coords",this.op)} = idx;
          val ${this.op}= getX(${X1(s,"coords",this.op)});
        }
        setOutput(val);
      }
    `}};function X1(r,t,e){if(r===1)return`${t}`;if(r===2)return`${t}.x, ${t}.y`;if(r===3)return`${t}.x, ${t}.y, ${t}.z`;if(r===4)return`${t}.x, ${t}.y, ${t}.z, ${t}.w`;throw new Error(`Cumulative ${e} for rank ${r} is not yet supported`)}function j1(r,t,e){if(r===1)return`${t}`;if(r===2)return`${t}.y`;if(r===3)return`${t}.z`;if(r===4)return`${t}.w`;throw new Error(`Cumulative ${e} for rank ${r} is not yet supported`)}function Pu(r,t,e,o,n,s){let a=t.shape.length,i=I.getAxesPermutation([o],a),c=t;i!=null&&(c=_t({inputs:{x:t},backend:e,attrs:{perm:i}}));let p=I.getInnerMostAxes(1,a)[0];if(p!==a-1)throw new Error(`WebGL cumprod shader expects an inner-most axis=${t.shape.length-1} but got axis=${o}`);let l=c.shape[p],u=Kt({inputs:{x:c},backend:e});for(let m=0;m<=Math.ceil(Math.log2(l))-1;m++){let f=new Rc(r,c.shape,!1,s),d=[[m]],h=u;u=e.runWebGLProgram(f,[u],u.dtype,d),e.disposeIntermediateTensorInfo(h)}if(n){let m=new Rc(r,c.shape,n,s),f=u;u=e.runWebGLProgram(m,[u],u.dtype),e.disposeIntermediateTensorInfo(f)}if(i!=null){let m=I.getUndoAxesPermutation(i),f=_t({inputs:{x:u},backend:e,attrs:{perm:m}});return e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(c),f}return u}function QB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;return Pu(as.Prod,n,e,s,a,i)}var Y1={kernelName:Rs,backendName:"webgl",kernelFunc:QB};function JB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;return Pu(as.Sum,n,e,s,a,i)}var Z1={kernelName:As,backendName:"webgl",kernelFunc:JB};function tV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a,binaryOutput:i}=o;if(n.shape.length===1){let c=e.readSync(n.dataId),p=e.readSync(s.dataId),l=Ql(c,p,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,l)}else if(n.shape.length===2){let c=e.bufferSync(n),p=e.bufferSync(s),l=Mw(c,p,a,i);return e.makeTensorInfo(l.shape,s.dtype,l.values)}throw new Error(`Error in denseBincount: input must be at most rank 2, but got rank${n.shape.length}.`)}var Q1={kernelName:Ds,backendName:"webgl",kernelFunc:tV};var Lu=class{constructor(t,e,o){this.variableNames=["x"],this.outputShape=[],this.outputShape=t,this.blockSize=e,this.dataFormat=o,this.userCode=`
    void main() {
      ivec4 coords = getOutputCoords();
      int b = coords[0];
      int h = ${this.getHeightCoordString()};
      int w = ${this.getWidthCoordString()};
      int d = ${this.getDepthCoordString()};

      int in_h = h / ${e};
      int offset_h = imod(h, ${e});
      int in_w = w / ${e};
      int offset_w = imod(w, ${e});
      int offset_d = (offset_h * ${e} + offset_w) *
        ${this.getOutputDepthSize()};
      int in_d = d + offset_d;

      float result = ${this.getInputSamplingString()};
      setOutput(result);
    }
  `}getHeightCoordString(){return this.dataFormat==="NHWC"?"coords[1]":"coords[2]"}getWidthCoordString(){return this.dataFormat==="NHWC"?"coords[2]":"coords[3]"}getDepthCoordString(){return this.dataFormat==="NHWC"?"coords[3]":"coords[1]"}getOutputDepthSize(){return this.dataFormat==="NHWC"?this.outputShape[3]:this.outputShape[1]}getInputSamplingString(){return this.dataFormat==="NHWC"?"getX(b, in_h, in_w, in_d)":"getX(b, in_d, in_h, in_w)"}};function eV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockSize:s,dataFormat:a}=o,i=n.shape[0],c=a==="NHWC"?n.shape[1]:n.shape[2],p=a==="NHWC"?n.shape[2]:n.shape[3],l=a==="NHWC"?n.shape[3]:n.shape[1],u=c*s,m=p*s,f=l/(s*s),d=a==="NHWC"?[i,u,m,f]:[i,f,u,m],h=new Lu(d,s,a);return e.runWebGLProgram(h,[n],n.dtype)}var J1={kernelName:_s,backendName:"webgl",kernelFunc:eV};var $i=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=t.outShape,this.enableShapeUniforms=$t(this.outputShape.length);let a=t.filterHeight,i=t.filterWidth,c=t.outChannels/t.inChannels,p="",l="";o&&(n?p=`float activation(float a) {
          float b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?p=`float activation(float a) {
          float b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:p=`
          float activation(float x) {
            ${o}
          }
        `,l="result = activation(result);");let u=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${p}

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / ${c};
        int q = d2 - d1 * ${c};

        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // Convolve x(?, ?, d1) with w(:, :, d1, q) to get y(yR, yC, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        // TO DO(dsmilkov): Flatten the two for loops and vec4 the operations.
        for (int wR = 0; wR < ${a}; wR++) {
          int xR = xRCorner + wR * dilations[0];

          if (xR < 0 || xR >= inDims[0]) {
            continue;
          }

          for (int wC = 0; wC < ${i}; wC++) {
            int xC = xCCorner + wC * dilations[1];

            if (xC < 0 || xC >= inDims[1]) {
              continue;
            }

            float xVal = getX(batch, xR, xC, d1);
            float wVal = getW(wR, wC, d1, q);
            dotProd += xVal * wVal;
          }
        }

        float result = dotProd;
        ${u}
        ${l}
        setOutput(result);
      }
    `}};var Ri=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=t.outShape,this.enableShapeUniforms=$t(this.outputShape.length);let a=t.outChannels/t.inChannels,i=t.padInfo.left,c=t.strideWidth,p=t.dilationWidth,l=t.filterHeight,u=t.filterWidth,m=u,f=`
      int xR; int xC; int xCOffset;
      vec4 wTexel; vec4 previous; vec4 final;`;for(let x=0;x<u;x++)f+=`
          vec4 xTexelC${x*2};
          int xTexelC${x*2}Ready;
          vec4 xTexelC${x*2+1};
          int xTexelC${x*2+1}Ready;
          vec4 xC${x};`;f+=`
    for (int r = 0; r < ${l}; r++) {
      `;for(let x=0;x<u;x++)f+=`
          xTexelC${x*2} = vec4(0.0);
          xTexelC${x*2}Ready = 0;
          xTexelC${x*2+1} = vec4(0.0);
          xTexelC${x*2+1}Ready = 0;
          xC${x} = vec4(0.0);`;f+=`
        xR = xRCorner + r * dilations[0];
        if (xR >=0 && xR < inDims[0]) {
      `;for(let x=0;x<(m+1)/2;x++){let b=x*2;if(f+=`
          xC = xCCorner + ${b*p};
          `,c===1){if(b<u&&(i%2===1?(f+=`
                xCOffset = xC + 1;
                if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xCOffset, d1);

                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }
              `,p===1&&b>0?f+=`
                xC${b} = vec4(xTexelC${b-2}.zw, xTexelC${b}.xy);
                `:f+=`
                  xCOffset = xC + 1 - 2;

                  if (xCOffset >= 0 && xCOffset < inDims[1]) {
                    previous = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      previous.zw = vec2(0.0);
                    }

                    xC${b} = vec4(previous.zw, xTexelC${b}.xy);
                  } else {
                    xC${b} = vec4(0.0, 0.0, xTexelC${b}.xy);
                  }
                  `):f+=`
                if (xC >= 0 && xC < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }

                xC${b} = xTexelC${b};
                `,b+1<u)){let S=i%2===0?y.nearestLargerEven(p):p;p%2===0&&i%2===1||p%2!==0&&i%2!==1?(f+=`
                  xCOffset = xC + imod(pads[1], 2) + ${S};

                  if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                    xTexelC${b+1} = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      xTexelC${b+1}.zw = vec2(0.0);
                    }
                    xTexelC${b+1}Ready = 1;
                  }
                  `,p>1?f+=`
                    xCOffset -= 2;
                    if (xCOffset >= 0 && xCOffset < inDims[1]) {
                     previous = getX(batch, xR, xCOffset, d1);
                     xC${b+1} = vec4(previous.zw, xTexelC${b+1}.xy);
                    } else {
                     xC${b+1} = vec4(0.0, 0.0, xTexelC${b+1}.xy);
                    }
                    `:f+=`
                    xC${b+1} = vec4(xTexelC${b}.zw, xTexelC${b+1}.xy);
                    `):S===1?f+=`
                    xC${b+1} = xTexelC${b};
                    `:f+=`
                    xCOffset = xC + ${S};

                    if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                      xTexelC${b+1} = getX(batch, xR, xCOffset, d1);
                      if (xCOffset + 1 >= inDims[1]) {
                        xTexelC${b+1}.zw = vec2(0.0);
                      }
                      xTexelC${b+1}Ready = 1;
                    }

                    xC${b+1} = xTexelC${b+1};
                    `}}else b<u&&(i%2===1?(f+=`
                xCOffset = xC + 1 - strides[1];
                if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xCOffset, d1);
                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }

                if(xC + 1 >= 0 && xC + 1 < inDims[1] && xTexelC${b+1}Ready == 0) {
                  xTexelC${b+1} = getX(batch, xR, xC + 1, d1);
                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xC + 2 >= inDims[1]) {
                    xTexelC${b+1}.zw = vec2(0.0);
                  }
                  xTexelC${b+1}Ready = 1;
                }

                xC${b} = vec4(xTexelC${b}.zw, xTexelC${b+1}.zw);
              `,b+1<u&&(f+=`
                  final = vec4(0.0);
                  xCOffset = xC + 1 + strides[1];
                  if(xCOffset >= 0 && xCOffset < inDims[1]) {
                    final = getX(batch, xR, xCOffset, d1);
                  }
                  xC${b+1} = vec4(xTexelC${b+1}.xy, final.xy);
                `)):(f+=`
                if(xC >= 0 && xC < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }

                xCOffset = xC + strides[1];
                if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                  xTexelC${b+1} = getX(batch, xR, xCOffset, d1);
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${b+1}.zw = vec2(0.);
                  }
                  xTexelC${b+1}Ready = 1;
                }

                xC${b} = vec4(
                  xTexelC${b}.xy, xTexelC${b+1}.xy);
              `,b+1<u&&(f+=`
                  xC${b+1} = vec4(xTexelC${b}.zw, xTexelC${b+1}.zw);
                `)));b<u&&(f+=`
            wTexel = getW(r, ${b}, d1, q);
            dotProd += xC${b} * vec4(wTexel.xz, wTexel.xz);
          `,b+1<u&&(f+=`
              wTexel = getW(r, ${b+1}, d1, q);
              dotProd += xC${b+1} * vec4(wTexel.xz, wTexel.xz);
            `))}f+=`
    }
  `,f+=`
      }
    `;let d="",h="";o&&(n?d=`vec4 activation(vec4 a) {
          vec4 b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?d=`vec4 activation(vec4 a) {
          vec4 b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:d=`vec4 activation(vec4 x) {
          ${o}
        }`,h="result = activation(result);");let g=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${d}

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / ${a};
        int q = d2 - d1 * ${a};
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
        vec4 dotProd = vec4(0.000000000000001);

        ${f}

        vec4 result = dotProd - vec4(0.000000000000001);
        ${g}
        ${h}
        setOutput(result);
      }
    `}};function rV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:c,dimRoundingMode:p}=o,l=c;l==null&&(l=[1,1]),y.assert(I.eitherStridesOrDilationsAreOne(a,l),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${a} and dilations '${l}'`);let u=I.computeConv2DInfo(n.shape,s.shape,a,l,i,p,!0),m;F().getBool("WEBGL_PACK_DEPTHWISECONV")&&u.strideWidth<=2&&u.outChannels/u.inChannels===1?m=new Ri(u):m=new $i(u);let f=[[u.padInfo.top,u.padInfo.left],[u.strideHeight,u.strideWidth],[u.dilationHeight,u.dilationWidth],[u.inHeight,u.inWidth]];return e.runWebGLProgram(m,[n,s],"float32",f)}var tI={kernelName:Os,backendName:"webgl",kernelFunc:rV};var Bu=class{constructor(t){this.variableNames=["x","dy"],this.outputShape=t.filterShape;let e=t.strideHeight,o=t.strideWidth,n=t.padInfo.top,s=t.padInfo.left,a=t.outChannels/t.inChannels;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int wR = coords.x;
        int wC = coords.y;
        int d1 = coords.z;
        int dm = coords.w;
        int d2 = d1 * ${a} + dm;

        float dotProd = 0.0;

        // TO DO: Vec4 over the batch size
        for (int b = 0; b < ${t.batchSize}; b++) {
          for (int yR = 0; yR < ${t.outHeight}; yR++) {
            int xR = wR + yR * ${e} - ${n};

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int yC = 0; yC < ${t.outWidth}; yC++) {
              int xC = wC + yC * ${o} - ${s};

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              float dyValue = getDy(b, yR, yC, d2);
              float xValue = getX(b, xR, xC, d1);
              dotProd += (xValue * dyValue);
            }
          }
        }
        setOutput(dotProd);
      }
    `}},Vu=class{constructor(t){this.variableNames=["dy","W"],this.outputShape=t.inShape;let e=t.filterHeight,o=t.filterWidth,n=t.strideHeight,s=t.strideWidth,a=e-1-t.padInfo.top,i=o-1-t.padInfo.left,c=t.outChannels/t.inChannels;this.userCode=`
      const ivec2 pads = ivec2(${a}, ${i});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[3];
        ivec2 dyCorner = coords.yz - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        float dotProd = 0.0;

        for (int wR = 0; wR < ${e}; wR++) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          int wRPerm = ${e} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            int wCPerm = ${o} - 1 - wC;

            // TO DO: Vec4 over the channelMul
            for (int dm = 0; dm < ${c}; dm++) {
              int d2 = d1 * ${c} + dm;
              float xValue = getDy(batch, idyR, idyC, d2);
              float wValue = getW(wRPerm, wCPerm, d1, dm);
              dotProd += xValue * wValue;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function oV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,dilations:i,pad:c,dimRoundingMode:p,filterShape:l}=o,u=I.computeConv2DInfo(n.shape,l,a,i,c,p,!0),m=new Bu(u);return e.runWebGLProgram(m,[n,s],"float32")}var eI={kernelName:Ps,backendName:"webgl",kernelFunc:oV};function nV(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{strides:a,dilations:i,pad:c,dimRoundingMode:p,inputShape:l}=o,u=I.computeConv2DInfo(l,s.shape,a,i,c,p,!0),m=new Vu(u);return e.runWebGLProgram(m,[n,s],"float32")}var rI={kernelName:Ls,backendName:"webgl",kernelFunc:nV};var Mu=class{constructor(t){this.variableNames=["X"],this.outputShape=[t,t],this.userCode=`
      void main() {
          ivec2 coords = getOutputCoords();
          float val = coords[0] == coords[1] ? getX(coords[0]) : 0.0;
          setOutput(val);
      }
    `}};function sV(r){let{inputs:t,backend:e}=r,{x:o}=t,n=[...o.shape,...o.shape],s=y.sizeFromShape(o.shape),a=K({inputs:{x:o},backend:e,attrs:{shape:[s]}}),i=new Mu(s),c=e.runWebGLProgram(i,[a],a.dtype),p=K({inputs:{x:c},backend:e,attrs:{shape:n}});return e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(c),p}var oI={kernelName:Bs,backendName:"webgl",kernelFunc:sV};var zu=class{constructor(t){this.variableNames=["x","W"],this.outputShape=t.outShape;let{inHeight:e,inWidth:o,padInfo:n,strideHeight:s,strideWidth:a,filterHeight:i,filterWidth:c,dilationHeight:p,dilationWidth:l}=t,{top:u,left:m}=n;this.userCode=`
      const ivec2 strides = ivec2(${s}, ${a});
      const ivec2 pads = ivec2(${u}, ${m});
      const float neg_infinity = -3.4e38;

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        int d1 = coords.w;
        ivec2 outTopLeftCorner =
            coords.yz * strides - pads;
        int hBeg = outTopLeftCorner.x;
        int wBeg = outTopLeftCorner.y;

        float curVal = neg_infinity;
        for (int h = 0; h < ${i}; h++) {
          int hIn = hBeg + h * ${p};

          if (hIn >= 0 && hIn < ${e}) {
            for (int w = 0; w < ${c}; w++) {
              int wIn = wBeg + w * ${l};

              if (wIn >= 0 && wIn < ${o}) {
                float xVal = getX(batch, hIn, wIn, d1);
                float wVal = getW(h, w, d1);

                float val = xVal + wVal;
                if (val > curVal) {
                  curVal = val;
                }
              }
            }
          }
        }

        float result = curVal;
        setOutput(result);
      }
    `}};function aV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:c}=o,p=I.computeDilation2DInfo(n.shape,s.shape,a,i,"NHWC",c),l,u=new zu(p);l=e.runWebGLProgram(u,[n,s],"float32");let m=K({inputs:{x:l},backend:e,attrs:{shape:p.outShape}});return e.disposeIntermediateTensorInfo(l),m}var nI={kernelName:Vs,backendName:"webgl",kernelFunc:aV};function iV(r){let{inputs:t,backend:e,attrs:o}=r,{equation:n}=o,s=t,{allDims:a,summedDims:i,idDims:c}=I.decodeEinsumEquation(n,s.length);I.checkEinsumDimSizes(a.length,c,s);let{path:p,steps:l}=I.getEinsumComputePath(i,c),u=l.length,m=null,f=a.length,d=[];for(let h=0;h<u;++h){for(let g of l[h]){let{permutationIndices:x,expandDims:b}=I.getEinsumPermutation(f,c[g]),S;I.isIdentityPermutation(x)?S=s[g]:(S=_t({inputs:{x:s[g]},backend:e,attrs:{perm:x}}),d.push(S));let N=S.shape.slice();for(let k=0;k<b.length;++k)N.splice(b[k],0,1);y.arraysEqual(S.shape,N)||(S=K({inputs:{x:S},backend:e,attrs:{shape:N}}),d.push(S)),m===null?m=S:(m=Ec({inputs:{a:S,b:m},backend:e}),d.push(m))}h<u-1&&(p[h]>=0&&(m=os({inputs:{x:m},backend:e,attrs:{axis:p[h]-(a.length-f),keepDims:!1}}),d.push(m)),f--)}for(let h of d)h!==m&&e.disposeIntermediateTensorInfo(h);return m}var sI={kernelName:Ms,backendName:"webgl",kernelFunc:iV};var cV="return (x >= 0.0) ? x : (exp(x) - 1.0);",pV=`
  vec4 result;

  result.r = (x.r >= 0.0) ? x.r : (exp(x.r) - 1.0);
  result.g = (x.g >= 0.0) ? x.g : (exp(x.g) - 1.0);
  result.b = (x.b >= 0.0) ? x.b : (exp(x.b) - 1.0);
  result.a = (x.a >= 0.0) ? x.a : (exp(x.a) - 1.0);

  return result;
`,lV=rt({opSnippet:cV,packedOpSnippet:pV}),aI={kernelName:"Elu",backendName:"webgl",kernelFunc:lV};var uV="return (b >= 1.0) ? a : a * (b + 1.0);",mV=`
  vec4 bGTEZero = vec4(greaterThanEqual(b, vec4(0.)));
  return (bGTEZero * a) + ((vec4(1.0) - bGTEZero) * (a * (b + vec4(1.0))));
`,fV=r=>{let{inputs:t,backend:e}=r,{dy:o,y:n}=t,s=F().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new or(mV,o.shape,n.shape):new We(uV,o.shape,n.shape);return e.runWebGLProgram(s,[o,n],o.dtype)},iI={kernelName:Uc,backendName:"webgl",kernelFunc:fV};var dV=`
  return vec4(equal(a, b));
`,hV="return float(a == b);",gV=Nt({opSnippet:hV,packedOpSnippet:dV,dtype:"bool",cpuKernelImpl:Uw}),cI={kernelName:Wo,backendName:"webgl",kernelFunc:gV};var xV=`
  // Error function is calculated approximately with elementary function.
  // See "Handbook of Mathematical Functions with Formulas,
  // Graphs, and Mathematical Tables", Abramowitz and Stegun.
  float p = ${I.ERF_P};
  float a1 = ${I.ERF_A1};
  float a2 = ${I.ERF_A2};
  float a3 = ${I.ERF_A3};
  float a4 = ${I.ERF_A4};
  float a5 = ${I.ERF_A5};

  float sign = sign(x);
  x = abs(x);
  float t = 1.0 / (1.0 + p * x);
  return sign * (1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*exp(-x*x));
`,yV=rt({opSnippet:xV}),pI={kernelName:"Erf",backendName:"webgl",kernelFunc:yV};var bV=nr+`
  return exp(x);
`,CV=`
  vec4 result = exp(x);
  bvec4 isNaN = isnan(x);
  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,gh=rt({opSnippet:bV,packedOpSnippet:CV,cpuKernelImpl:Hw,dtype:"float32"}),lI={kernelName:"Exp",backendName:"webgl",kernelFunc:gh};function Wu(r){let{inputs:t,attrs:e,backend:o}=r,{dim:n}=e,{input:s}=t,a=s.shape.length,i=s.shape.slice(),c=n;return n<0&&(y.assert(-(a+1)<=n,()=>`Axis must be in the interval [${-(a+1)}, ${a}]`),c=a+n+1),i.splice(c,0,1),K({inputs:{x:s},backend:o,attrs:{shape:i}})}var uI={kernelName:zs,backendName:"webgl",kernelFunc:Wu};var mI="return exp(x) - 1.0;",TV=rt({opSnippet:mI,packedOpSnippet:mI,cpuKernelImpl:Kw}),fI={kernelName:Go,backendName:"webgl",kernelFunc:TV};var Ac=class{constructor(t,e,o){this.variableNames=["real","imag"];let n=e[1];this.outputShape=e;let s=o?`2.0 * ${Math.PI}`:`-2.0 * ${Math.PI}`,a=o?`${n}.0`:"1.0",i;if(t==="real")i="return real * expR - imag * expI;";else if(t==="imag")i="return real * expI + imag * expR;";else throw new Error(`FFT component must be either "real" or "imag", got ${t}.`);this.userCode=`
      const float exponentMultiplier = ${s};

      float unaryOpComplex(float real, float expR, float imag, float expI) {
        ${i}
      }

      float mulMatDFT(int batch, int index) {
        float indexRatio = float(index) / float(${n});
        float exponentMultiplierTimesIndexRatio =
            exponentMultiplier * indexRatio;

        float result = 0.0;

        for (int i = 0; i < ${n}; i++) {
          // x = (-2|2 * PI / N) * index * i;
          float x = exponentMultiplierTimesIndexRatio * float(i);
          float expR = cos(x);
          float expI = sin(x);
          float real = getReal(batch, i);
          float imag = getImag(batch, i);

          result +=
              unaryOpComplex(real, expR, imag, expI) / ${a};
        }

        return result;
      }

      void main() {
        ivec2 coords = getOutputCoords();
        setOutput(mulMatDFT(coords[0], coords[1]));
      }
    `}};function Gu(r,t,e){let o=e.texData.get(r.dataId),n=y.sizeFromShape(r.shape),s=r.shape[r.shape.length-1],a=n/s,i=K({inputs:{x:r},backend:e,attrs:{shape:[a,s]}}),c=i.shape,p=new Ac("real",c,t),l=new Ac("imag",c,t),u=[{dataId:o.complexTensorInfos.real.dataId,dtype:o.complexTensorInfos.real.dtype,shape:c},{dataId:o.complexTensorInfos.imag.dataId,dtype:o.complexTensorInfos.imag.dtype,shape:c}],m=e.runWebGLProgram(p,u,"float32"),f=e.runWebGLProgram(l,u,"float32"),d=ve({inputs:{real:m,imag:f},backend:e});e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f);let h=K({inputs:{x:d},backend:e,attrs:{shape:r.shape}});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(d),h}function SV(r){let{inputs:t,backend:e}=r,{input:o}=t;return Gu(o,!1,e)}var dI={kernelName:"FFT",backendName:"webgl",kernelFunc:SV};var Uu=class{constructor(t,e){this.outputShape=[],this.customUniforms=[{name:"value",type:"float"}],this.variableNames=["x"],this.outputShape=t,this.userCode=`
      void main() {
        // Input can be obtained from uniform value.
        setOutput(value);
      }
    `}};function jr(r){let{backend:t,attrs:e}=r,{shape:o,value:n}=e,{dtype:s}=e;if(s=s||y.inferDtype(n),s==="string"){let a=y.getArrayFromDType(s,y.sizeFromShape(o));return a.fill(n),t.makeTensorInfo(o,s,a)}else{let a=new Uu(o,n),i=[[n]];return t.runWebGLProgram(a,[],s,i)}}var hI={kernelName:Ws,backendName:"webgl",kernelFunc:jr};var Hu=class{constructor(t){this.variableNames=["Image"],this.outputShape=[];let e=t[2];this.outputShape=t,this.userCode=`
        void main() {
          ivec4 coords = getOutputCoords();
          int x = coords[2];

          int coordX = ${e} - x - 1;
          float outputValue;
          if(coordX >= 0 && coordX < ${e}) {
            outputValue = getImage(coords[0], coords[1], coordX, coords[3]);
          } else {
            outputValue = getImage(coords[0], coords[1], coords[2], coords[3]);
          }
          setOutput(outputValue);
        }
    `}};var gI={kernelName:Gs,backendName:"webgl",kernelFunc:({inputs:r,backend:t})=>{let{image:e}=r,o=t,n=new Hu(e.shape);return o.runWebGLProgram(n,[e],e.dtype)}};var xI="return floor(x);",wV=rt({opSnippet:xI,packedOpSnippet:xI,cpuKernelImpl:qw}),yI={kernelName:Uo,backendName:"webgl",kernelFunc:wV};var NV=`
  float s = sign(a) * sign(b);
  int ia = round(a);
  int ib = round(b);
  if (ib != 0) {
    // Windows (D3D) wants guaranteed non-zero int division at compile-time.
    return float(idiv(ia, ib, s));
  } else {
    return NAN;
  }
`,IV=`
  ivec4 ia = round(a);
  ivec4 ib = round(b);
  bvec4 cond = notEqual(ib, ivec4(0));
  ivec4 result = ivec4(0);
  vec4 s = sign(a) * sign(b);

  // Windows (D3D) wants guaranteed non-zero int division at compile-time.
  if (cond[0]) {
    result[0] = idiv(ia[0], ib[0], s[0]);
  }
  if (cond[1]) {
    result[1] = idiv(ia[1], ib[1], s[1]);
  }
  if (cond[2]) {
    result[2] = idiv(ia[2], ib[2], s[2]);
  }
  if (cond[3]) {
    result[3] = idiv(ia[3], ib[3], s[3]);
  }
  return vec4(result);
`,vV=Nt({opSnippet:NV,packedOpSnippet:IV,dtype:"int32"}),bI={kernelName:Ho,backendName:"webgl",kernelFunc:vV};var Ku=class{constructor(t){this.variableNames=["A"];let e=Vt(),[o,n]=t;this.outputShape=t,this.userCode=`
      void main() {
        ivec3 coords = getOutputCoords();
        int texR = coords[0];
        int texC = coords[1];
        int depth = coords[2];
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${n}.0, ${o}.0);

        vec4 values = ${e.texture2D}(A, uv);
        float value;
        if (depth == 0) {
          value = values.r;
        } else if (depth == 1) {
          value = values.g;
        } else if (depth == 2) {
          value = values.b;
        } else if (depth == 3) {
          value = values.a;
        }

        setOutput(floor(value * 255.0 + 0.5));
      }
    `}};var qu=class{constructor(t){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0;let e=Vt(),[o,n]=t;this.outputShape=t,this.userCode=`
      void main() {
        ivec3 coords = getOutputCoords();
        int texR = coords[0];
        int texC = coords[1];
        int depth = coords[2];

        vec4 result = vec4(0.);

        for(int row=0; row<=1; row++) {
          for(int col=0; col<=1; col++) {
            texC = coords[1] + row;
            depth = coords[2] + col;

            vec2 uv = (vec2(texC, texR) + halfCR) /
                       vec2(${n}.0, ${o}.0);
            vec4 values = ${e.texture2D}(A, uv);
            float value;
            if (depth == 0) {
              value = values.r;
            } else if (depth == 1) {
              value = values.g;
            } else if (depth == 2) {
              value = values.b;
            } else if (depth == 3) {
              value = values.a;
            }

            result[row * 2 + col] = floor(value * 255.0 + 0.5);
          }
        }

        ${e.output} = result;
      }
    `}};var CI={kernelName:rg,backendName:"webgl",kernelFunc:kV},Ai,xh=F().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");function kV(r){let{inputs:t,backend:e,attrs:o}=r,{pixels:n}=t,{numChannels:s}=o,a=typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement,i=typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement,[c,p]=a?[n.videoWidth,n.videoHeight]:[n.width,n.height],l=[p,c],u=[p,c,s];if(i||a){let h=F().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");(Ai==null||h!==xh)&&(xh=h,Ai=document.createElement("canvas").getContext("2d",{willReadFrequently:xh})),Ai.canvas.width=c,Ai.canvas.height=p,Ai.drawImage(n,0,0,c,p),n=Ai.canvas}let m=e.makeTensorInfo(l,"int32");e.texData.get(m.dataId).usage=ue.PIXELS,e.gpgpu.uploadPixelDataToTexture(e.getTexture(m.dataId),n);let f=F().getBool("WEBGL_PACK")?new qu(u):new Ku(u),d=e.runWebGLProgram(f,[m],"int32");return e.disposeData(m.dataId),d}function EV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:c,pad:p,dataFormat:l,dilations:u,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,h=I.convertConv2DDataFormat(l),g=I.computeConv2DInfo(n.shape,s.shape,c,u,p,m,!1,h),x,b=[],S=a!=null,N=i!=null,k=f==="leakyrelu",$=()=>{let A=[n,s],D=(_,O)=>{if(O==="NCHW"&&_.shape.length===1&&_.shape[0]!==1){let L=K({inputs:{x:_},backend:e,attrs:{shape:[_.shape[0],1,1]}});return b.push(L),L}return _};if(S&&A.push(D(a,l)),N&&A.push(D(i,l)),k){let _=e.makeTensorInfo([],"float32",y.createScalarValue(d,"float32"));A.push(_),b.push(_)}return A};if(g.filterHeight===1&&g.filterWidth===1&&g.dilationHeight===1&&g.dilationWidth===1&&g.strideHeight===1&&g.strideWidth===1&&(g.padInfo.type==="SAME"||g.padInfo.type==="VALID"))x=$u({x:n,filter:s,convInfo:g,backend:e,bias:a,activation:f,preluActivationWeights:i,leakyreluAlpha:d});else if(g.strideWidth<=2&&h==="channelsLast"&&F().getBool("WEBGL_EXP_CONV")){let A=f?qr(f,!0):null,D=new Ei(g,S,A,N,k),_=[[g.padInfo.top,g.padInfo.left],[g.strideHeight,g.strideWidth],[g.dilationHeight,g.dilationWidth],[g.inHeight,g.inWidth]],O=$();x=e.runWebGLProgram(D,O,"float32",_)}else if(F().getBool("WEBGL_CONV_IM2COL"))x=Ru({x:n,filter:s,convInfo:g,backend:e,bias:a,activation:f,preluActivationWeights:i,leakyreluAlpha:d});else{let A=f?qr(f,!1):null,D=new ki(g,S,A,N,k),_=$();x=e.runWebGLProgram(D,_,"float32")}let R=K({inputs:{x},backend:e,attrs:{shape:g.outShape}});return b.push(x),b.forEach(A=>e.disposeIntermediateTensorInfo(A)),R}var TI={kernelName:wn,backendName:"webgl",kernelFunc:EV};function $V(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:c,pad:p,dilations:l,dimRoundingMode:u,activation:m,leakyreluAlpha:f}=o,d=[],h=l;h==null&&(h=[1,1]),y.assert(I.eitherStridesOrDilationsAreOne(c,h),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${c} and dilations '${h}'`);let g=I.computeConv2DInfo(n.shape,s.shape,c,h,p,u,!0),x=F().getBool("WEBGL_PACK_DEPTHWISECONV")&&g.strideWidth<=2&&g.outChannels/g.inChannels===1,b=m?qr(m,x):null,S=[n,s],N=a!=null,k=i!=null,$=m==="leakyrelu";if(N&&S.push(a),k&&S.push(i),$){let _=e.makeTensorInfo([],"float32",y.createScalarValue(f,"float32"));S.push(_),d.push(_)}let R;x?R=new Ri(g,N,b,k,$):R=new $i(g,N,b,k,$);let A=[[g.padInfo.top,g.padInfo.left],[g.strideHeight,g.strideWidth],[g.dilationHeight,g.dilationWidth],[g.inHeight,g.inWidth]],D=e.runWebGLProgram(R,S,"float32",A);return d.forEach(_=>e.disposeIntermediateTensorInfo(_)),D}var SI={kernelName:Nn,backendName:"webgl",kernelFunc:$V};var Xu=class{constructor(t,e,o,n){this.sliceDim=t,this.strides=e,this.paramsShape=n,this.variableNames=["x","indices"],this.outputShape=o;let s=mt(o.length),a=`
    int index;`;for(let i=0;i<this.sliceDim;i++)a+=`
          index = round(getIndices(coords[0], ${i}));
          out_of_bounds = out_of_bounds || index < 0;
          out_of_bounds = out_of_bounds || index >= ${this.paramsShape[i]};
          flattenIndex += index * ${this.strides[i]};`;this.userCode=`
         void main() {
          ${s} coords = getOutputCoords();
          int flattenIndex = 0;
          bool out_of_bounds = false;

          ${a}

          setOutput(out_of_bounds ? 0.0 : getX(flattenIndex, coords[1]));
        }
      `}};function RV(r){let{inputs:t,backend:e}=r,{params:o,indices:n}=t,s=n.shape,a=s[s.length-1],i=y.sizeFromShape(o.shape),[c,p,l,u]=I.prepareAndValidate(o,n),m=K({inputs:{x:n},backend:e,attrs:{shape:[p,a]}}),f=K({inputs:{x:o},backend:e,attrs:{shape:[y.sizeFromShape(o.shape)/l,l]}});if(e.shouldExecuteOnCPU([o,n])||o.dtype==="string"){let x=e.readSync(n.dataId),b=e.bufferSync(o),S=Xw(x,b,o.dtype,p,a,l,u,o.shape,i);return e.makeTensorInfo(c,o.dtype,S.values)}let d=new Xu(a,u,[p,l],o.shape),h=e.runWebGLProgram(d,[f,m],f.dtype),g=K({inputs:{x:h},backend:e,attrs:{shape:c}});return e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(h),g}var wI={kernelName:Ks,backendName:"webgl",kernelFunc:RV};var ju=class{constructor(t,e){this.variableNames=["A","indices"],this.outputShape=e,this.rank=e.length;let o=mt(this.rank),n=AV(t,2);this.userCode=`
      void main() {
        ${o} resRC = getOutputCoords();
        int index = int(getIndices(resRC.x, resRC.z));
        float inBounds = (index >= 0) && (index < ${t[2]}) ? 1.0 : 0.0;
        setOutput(inBounds * getA(${n}));
      }
    `}};function AV(r,t){let e=["resRC.x","resRC.y","resRC.z","resRC.w"],o=[];for(let n=0;n<r.length;n++)n===2?o.push("index"):o.push(`${e[n]}`);return o.join()}function yh(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,indices:s}=t,{axis:a,batchDims:i}=o,c=y.parseAxisParam(a,n.shape)[0];if(F().get("DEBUG")){let b=e.readSync(s.dataId),S=n.shape[c];for(let N=0;N<b.length;++N){let k=b[N];y.assert(k<=S-1&&k>=0,()=>`GatherV2: the index value ${k} is not in [0, ${S-1}]`)}}let p=I.segment_util.collectGatherOpShapeInfo(n,s,c,i),l=y.sizeFromShape(s.shape),u=[],m=K({inputs:{x:n},backend:e,attrs:{shape:[p.batchSize,p.outerSize,p.dimSize,p.sliceSize]}}),f=K({inputs:{x:s},backend:e,attrs:{shape:[p.batchSize,l/p.batchSize]}});u.push(m),u.push(f);let d=[p.batchSize,p.outerSize,l/p.batchSize,p.sliceSize];if(e.shouldExecuteOnCPU([n,s])||n.dtype==="string"){let b=e.bufferSync(f),S=e.bufferSync(m),N=jw(S,b,d);return u.forEach(k=>e.disposeIntermediateTensorInfo(k)),e.makeTensorInfo(p.outputShape,N.dtype,N.values)}let h=new ju(m.shape,d),g=e.runWebGLProgram(h,[m,f],m.dtype);u.push(g);let x=K({inputs:{x:g},backend:e,attrs:{shape:p.outputShape}});return u.forEach(b=>e.disposeIntermediateTensorInfo(b)),x}var NI={kernelName:Hs,backendName:"webgl",kernelFunc:yh};var FV="return float(a > b);",DV=`
  return vec4(greaterThan(a, b));
`,_V=Nt({opSnippet:FV,packedOpSnippet:DV,cpuKernelImpl:Yw,dtype:"bool"}),II={kernelName:Ko,backendName:"webgl",kernelFunc:_V};var OV="return float(a >= b);",PV=`
  return vec4(greaterThanEqual(a, b));
`,LV=Nt({opSnippet:OV,packedOpSnippet:PV,dtype:"bool",cpuKernelImpl:Zw}),vI={kernelName:qo,backendName:"webgl",kernelFunc:LV};function BV(r){let{inputs:t,backend:e}=r,{input:o}=t;return Gu(o,!0,e)}var kI={kernelName:qs,backendName:"webgl",kernelFunc:BV};var VV="return float(!isnan(x) && !isinf(x));",MV=rt({opSnippet:VV,dtype:"bool"}),EI={kernelName:Xo,backendName:"webgl",kernelFunc:MV};var zV="return float(isinf(x));",WV=rt({opSnippet:zV,dtype:"bool"}),$I={kernelName:jo,backendName:"webgl",kernelFunc:WV};var GV="return float(isnan(x));",UV=rt({opSnippet:GV,dtype:"bool"}),RI={kernelName:Yo,backendName:"webgl",kernelFunc:UV};var HV="return float(a < b);",KV=`
  return vec4(lessThan(a, b));
`,qV=Nt({opSnippet:HV,packedOpSnippet:KV,cpuKernelImpl:Qw,dtype:"bool"}),AI={kernelName:Zo,backendName:"webgl",kernelFunc:qV};var XV="return float(a <= b);",jV=`
  return vec4(lessThanEqual(a, b));
`,YV=Nt({opSnippet:XV,packedOpSnippet:jV,cpuKernelImpl:Jw,dtype:"bool"}),FI={kernelName:Qo,backendName:"webgl",kernelFunc:YV};function ZV(r){let{backend:t,attrs:e}=r,{start:o,stop:n,num:s}=e,a=tN(o,n,s);return t.makeTensorInfo([a.length],"float32",a)}var DI={kernelName:Ys,backendName:"webgl",kernelFunc:ZV};var QV=nr+`
  return x < 0.0 ? 0./0. : log(x);
`,JV=`
  vec4 result = log(x);
  bvec4 isNaN = isnan(x);
  result.r = isNaN.r ? x.r : (x.r < 0.0 ? 0./0. : result.r);
  result.g = isNaN.g ? x.g : (x.g < 0.0 ? 0./0. : result.g);
  result.b = isNaN.b ? x.b : (x.b < 0.0 ? 0./0. : result.b);
  result.a = isNaN.a ? x.a : (x.a < 0.0 ? 0./0. : result.a);
  return result;
`,tM=rt({opSnippet:QV,packedOpSnippet:JV,cpuKernelImpl:eN}),_I={kernelName:"Log",backendName:"webgl",kernelFunc:tM};var eM=nr+`
  return log(1.0 + x);
`,rM=rt({opSnippet:eM}),OI={kernelName:Jo,backendName:"webgl",kernelFunc:rM};var oM="return float(a >= 1.0 && b >= 1.0);",nM=`
  return vec4(
    vec4(greaterThanEqual(a, vec4(1.0))) *
    vec4(greaterThanEqual(b, vec4(1.0))));
`,sM=Nt({opSnippet:oM,packedOpSnippet:nM,dtype:"bool"}),PI={kernelName:tn,backendName:"webgl",kernelFunc:sM};var aM="return float(!(x >= 1.0));",iM=rt({opSnippet:aM}),LI={kernelName:en,backendName:"webgl",kernelFunc:iM};var cM="return float(a >= 1.0 || b >= 1.0);",pM=`
  return min(
    vec4(greaterThanEqual(a, vec4(1.0))) +
    vec4(greaterThanEqual(b, vec4(1.0))),
    vec4(1.0));
`,lM=Nt({opSnippet:cM,packedOpSnippet:pM,dtype:"bool"}),BI={kernelName:rn,backendName:"webgl",kernelFunc:lM};var Yu=class{constructor(t,e,o,n,s){this.variableNames=["x"],this.outputShape=[];let a=e,i=t[3]-1;this.outputShape=t;let c,p=`float(${o}) + float(${n}) * sum`;s===.5?c=`inversesqrt(${p})`:s===1?c=`1.0/(${p})`:c=`exp(log(${p}) * float(-${s}));`,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int r = coords[1];
        int c = coords[2];
        int d = coords[3];
        float x = getX(b, r, c, d);
        float sum = 0.0;
        for (int j = -${a}; j <= ${a}; j++) {
          int idx = d + j;
          if (idx >= 0 && idx <=  ${i}) {
            float z = getX(b, r, c, idx);
            sum += z * z;
          }
        }
        float val = x * ${c};
        setOutput(val);
      }
    `}};var Zu=class{constructor(t,e,o,n,s){this.variableNames=["x"],this.outputShape=[],this.packedInputs=!0,this.packedOutput=!0;let a=e,i=t[3]-1;this.outputShape=t;let c,p=`float(${o}) + float(${n}) * sum`;s===.5?c=`inversesqrt(${p})`:s===1?c=`1.0/(${p})`:c=`exp(log(${p}) * float(-${s}));`,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords.x;
        int r = coords.y;
        int c = coords.z;
        int d = coords.w;

        bool hasNextCol = d < ${this.outputShape[3]};
        bool hasNextRow = c < ${this.outputShape[2]};

        vec4 sum = vec4(0.);
        vec4 xFragAtOutputCoords = getX(b, r, c, d);

        vec4 xAtOutputCoords = vec4(
          getChannel(xFragAtOutputCoords, vec2(c, d)),
          hasNextCol ?
            getChannel(xFragAtOutputCoords, vec2(c, d + 1)) : 0.0,
          hasNextRow ?
            getChannel(xFragAtOutputCoords , vec2(c + 1, d)) : 0.0,
          (hasNextRow && hasNextCol) ?
            getChannel(xFragAtOutputCoords, vec2(c + 1, d + 1)) : 0.0
        );

        int firstChannel = d - ${a};
        vec2 cache = vec2(0.);
        if(firstChannel >= 0){
          vec4 firstChannelFrag = getX(b, r, c, firstChannel);
          cache.x = getChannel(firstChannelFrag, vec2(c, firstChannel));
            if(hasNextRow){
              cache.y = getChannel(firstChannelFrag, vec2(c + 1, firstChannel));
            }
        }

        ivec2 depth = ivec2(d, d + 1);
        for (int j = - ${a}; j <= ${a}; j++) {
          ivec2 idx = depth + j;
          bvec2 aboveLowerBound = greaterThanEqual(idx, ivec2(0));
          bvec2 belowUpperBound = lessThanEqual(idx, ivec2(${i}));

          bool depthInRange = aboveLowerBound.x && belowUpperBound.x;
          bool depthPlusOneInRange = aboveLowerBound.y && belowUpperBound.y;

          if(depthInRange || depthPlusOneInRange){
            vec4 z = vec4(0.);
            vec4 xFragAtCurrentDepth;
            z.xz = cache.xy;
            if(depthPlusOneInRange && hasNextCol){
              xFragAtCurrentDepth = idx.y != d ?
                getX(b, r, c, idx.y) : xFragAtOutputCoords;
              z.y = getChannel(xFragAtCurrentDepth, vec2(c, idx.y));
              if(hasNextRow){
                z.w = getChannel(xFragAtCurrentDepth, vec2(c + 1, idx.y));
              }
            }
            cache.xy = z.yw;
            sum += z * z;
          }
        }
        vec4 result = xAtOutputCoords * ${c};
        setOutput(result);
      }
    `}};var uM=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{depthRadius:s,bias:a,alpha:i,beta:c}=o,p=F().getBool("WEBGL_PACK_NORMALIZATION")?new Zu(n.shape,s,a,i,c):new Yu(n.shape,s,a,i,c);return e.runWebGLProgram(p,[n],n.dtype)},VI={kernelName:"LRN",backendName:"webgl",kernelFunc:uM};var Qu=class{constructor(t,e,o,n,s){this.variableNames=["inputImage","outputImage","dy"],this.outputShape=[],this.outputShape=t,this.depth=t[3],this.depthRadius=e,this.bias=o,this.alpha=n,this.beta=s,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int r = coords[1];
        int c = coords[2];

        float result = 0.0;
        for (int d = 0; d < ${this.depth}; ++d) {
          int depthBegin = int(max(0.0, float(d - ${e})));
          int depthEnd = int(min(float(${this.depth}),
              float(d + ${e} + 1)));

          const int MIN_DEPTH_BEGIN = 0;
          const int MAX_DEPTH_END = ${this.depth};

          float norm = 0.0;
          for (int k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; ++k) {
            if (k < depthBegin){
              continue;
            }
            else if (k >= depthBegin && k < depthEnd) {
              norm += getInputImage(b, r, c, k) * getInputImage(b, r, c, k);
            }
            else {
              break;
            }
          }

          norm = float(${n}) * norm + float(${o});

          for(int k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; ++k){
            if (k < depthBegin){
              continue;
            }
            else if (k >= depthBegin && k < depthEnd){
              float dyi = -2.0 * float(${n})
                * float(${s})
                * getInputImage(b ,r ,c, k) * getOutputImage(b, r, c, d)
                / norm;
              if (k == d) {
                dyi += pow(norm, -1.0 * ${s});
              }
              if (k == coords[3]) {
                dyi *= getDy(b, r, c, d);
                result += dyi;
              }
            }
            else {
              break;
            }
          }
      }
      setOutput(result);
      }
    `}};var mM=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n,y:s,dy:a}=t,{depthRadius:i,bias:c,alpha:p,beta:l}=o,u=new Qu(n.shape,i,c,p,l);return e.runWebGLProgram(u,[n,s,a],n.dtype)},MI={kernelName:Hc,backendName:"webgl",kernelFunc:mM};function zI(r,t,e,o){let n=y.sizeFromShape(t),a=y.sizeFromShape(r.shape)/n,i=K({inputs:{x:r},attrs:{shape:[a,n]},backend:o}),c=De(i,r.dtype,"max",o),p=K({inputs:{x:c},attrs:{shape:e},backend:o});return o.disposeIntermediateTensorInfo(i),o.disposeIntermediateTensorInfo(c),p}function bh(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reductionIndices:s,keepDims:a}=o,i=n.shape.length,c=y.parseAxisParam(s,n.shape),p=c,l=I.getAxesPermutation(p,i),u=l!=null,m=e.shouldExecuteOnCPU([n]),f=n;if(u){if(m){let S=e.texData.get(f.dataId).values,N=new Array(i);for(let R=0;R<N.length;R++)N[R]=n.shape[l[R]];let k=es(S,n.shape,n.dtype,l,N);f=e.makeTensorInfo(N,n.dtype);let $=e.texData.get(f.dataId);$.values=k}else f=Io(n,l,e);p=I.getInnerMostAxes(p.length,i)}I.assertAxesAreInnerMostDims("max",p,i);let[d,h]=I.computeOutAndReduceShapes(f.shape,p),g=d;a&&(g=I.expandShapeToKeepDim(d,c));let x;if(m){let S=e.texData.get(f.dataId).values,N=rN(S,y.sizeFromShape(h),g,n.dtype);x=e.makeTensorInfo(g,n.dtype);let k=e.texData.get(x.dataId);k.values=N}else x=zI(f,h,g,e);return u&&e.disposeIntermediateTensorInfo(f),x}var WI={kernelName:"Max",backendName:"webgl",kernelFunc:bh};var fM=Ni+`
  return max(a, b);
`,dM=`
  vec4 result = vec4(max(a, b));
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+Fr+`
  return result;
`,hM=Nt({opSnippet:fM,packedOpSnippet:dM,cpuKernelImpl:oN}),GI={kernelName:on,backendName:"webgl",kernelFunc:hM};function gM(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;Ar(n,"maxPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:c}=o,p=1;y.assert(I.eitherStridesOrDilationsAreOne(a,p),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${p}'`);let l=I.computePool2DInfo(n.shape,s,a,p,i,c);if(l.filterWidth===1&&l.filterHeight===1&&y.arraysEqual(l.inShape,l.outShape))return Kt({inputs:{x:n},backend:e});let u=new dr(l,"max",!1);return e.runWebGLProgram(u,[n],n.dtype)}var UI={kernelName:Zs,backendName:"webgl",kernelFunc:gM};function xM(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dataFormat:c,dimRoundingMode:p}=o,l=[1,1,1],u=I.computePool3DInfo(n.shape,s,a,l,i,p,c),m=new vo(u,"max",!1);return e.runWebGLProgram(m,[n],n.dtype)}var HI={kernelName:Qs,backendName:"webgl",kernelFunc:xM};var Ju=class{constructor(t){this.variableNames=["dy","maxPos"],this.outputShape=t.inShape;let e=t.strideHeight,o=t.strideWidth,n=t.dilationHeight,s=t.effectiveFilterHeight,a=t.effectiveFilterWidth,i=s-1-t.padInfo.top,c=a-1-t.padInfo.left,p=s*a-1;this.userCode=`
      const ivec2 pads = ivec2(${i}, ${c});

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];

        ivec2 dyRCCorner = coords.yz - pads;
        int dyRCorner = dyRCCorner.x;
        int dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${s};
          wR += ${n}) {
          float dyR = float(dyRCorner + wR) / ${e}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          for (int wC = 0; wC < ${a}; wC++) {
            float dyC = float(dyCCorner + wC) / ${o}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            float dyValue = getDy(b, idyR, idyC, d);
            int maxPosValue = ${p} - int(getMaxPos(b, idyR, idyC, d));

            // Get the current value, check it against the value from the
            // position matrix.
            int curPosValue = wR * ${a} + wC;
            float mask = float(maxPosValue == curPosValue ? 1.0 : 0.0);

            dotProd += dyValue * mask;
          }
        }
        setOutput(dotProd);
      }
    `}},tm=class{constructor(t){this.variableNames=["dy","maxPos"],this.outputShape=t.inShape;let e=t.strideDepth,o=t.strideHeight,n=t.strideWidth,s=t.dilationDepth,a=t.dilationHeight,i=t.dilationWidth,c=t.effectiveFilterDepth,p=t.effectiveFilterHeight,l=t.effectiveFilterWidth,u=c-1-t.padInfo.front,m=p-1-t.padInfo.top,f=l-1-t.padInfo.left,d=c*p*l-1;this.userCode=`
      const ivec3 pads = ivec3(${u}, ${m}, ${f});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyDCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, ch) with pos mask(:, :, :, d) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int wD = 0; wD < ${c};
           wD += ${s}) {
          float dyD = float(dyDCorner + wD) / ${e}.0;

          if (dyD < 0.0 || dyD >= ${t.outDepth}.0 || fract(dyD) > 0.0) {
            continue;
          }
          int idyD = int(dyD);

          for (int wR = 0; wR < ${p};
              wR += ${a}) {
            float dyR = float(dyRCorner + wR) / ${o}.0;

            if (dyR < 0.0 || dyR >= ${t.outHeight}.0 ||
                fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            for (int wC = 0; wC < ${l};
                wC += ${i}) {
              float dyC = float(dyCCorner + wC) / ${n}.0;

              if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              float dyValue = getDy(batch, idyD, idyR, idyC, ch);
              int maxPosValue = ${d} -
                  int(getMaxPos(batch, idyD, idyR, idyC, ch));

              // Get the current value, check it against the value from the
              // position matrix.
              int curPosValue =
                  wD * ${p} * ${l} +
                  wR * ${l} + wC;
              float mask = float(maxPosValue == curPosValue ? 1.0 : 0.0);

              dotProd += dyValue * mask;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function yM(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s,{filterSize:i,strides:c,pad:p,dimRoundingMode:l}=o,u=[1,1,1],m=I.computePool3DInfo(a.shape,i,c,u,p,l),f=new vo(m,"max",!0),d=e.runWebGLProgram(f,[a],a.dtype),h=new tm(m),g=e.runWebGLProgram(h,[n,d],a.dtype);return e.disposeIntermediateTensorInfo(d),g}var KI={kernelName:qc,backendName:"webgl",kernelFunc:yM};function bM(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s,output:a}=t,i=s;Ar([s,a],"maxPoolGrad");let{filterSize:c,strides:p,pad:l,dimRoundingMode:u}=o,m=I.computePool2DInfo(i.shape,c,p,1,l,u),f=!0,d=new dr(m,"max",f),h=e.runWebGLProgram(d,[i],i.dtype),g=new Ju(m),x=e.runWebGLProgram(g,[n,h],i.dtype);return e.disposeIntermediateTensorInfo(h),x}var qI={kernelName:Kc,backendName:"webgl",kernelFunc:bM};function XI(r,t,e,o){let n=new dr(e,"max",!1),s=o.runWebGLProgram(n,[r],"float32");n=new dr(e,"max",!0,!0,t);let a=o.runWebGLProgram(n,[r],"float32");return[s,a]}var jI={kernelName:Js,backendName:"webgl",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{x:o}=r,{filterSize:n,strides:s,pad:a,includeBatchInIndex:i}=t,c=e;y.assert(o.shape.length===4,()=>`Error in maxPool: input must be rank 4 but got rank ${o.shape.length}.`);let p=[1,1];y.assert(I.eitherStridesOrDilationsAreOne(s,p),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${s} and dilations '${p}'`);let l=I.computePool2DInfo(o.shape,n,s,p,a),[u,m]=XI(o,i,l,c);return[u,m]}};function YI(r,t,e,o){let n=y.sizeFromShape(t),a=y.sizeFromShape(r.shape)/n,i=K({inputs:{x:r},attrs:{shape:[a,n]},backend:o}),c=De(i,"float32","mean",o),p=K({inputs:{x:c},attrs:{shape:e},backend:o});return o.disposeIntermediateTensorInfo(i),o.disposeIntermediateTensorInfo(c),p}var ZI={kernelName:ta,backendName:"webgl",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{x:o}=r,{keepDims:n,axis:s}=t,a=e,i=o.shape.length,c=y.parseAxisParam(s,o.shape),p=c,l=I.getAxesPermutation(p,i),u=l!=null,m=a.shouldExecuteOnCPU([o]),f=[],d=o;if(u){if(m){let N=a.texData.get(d.dataId).values,k=new Array(i);for(let A=0;A<k.length;A++)k[A]=o.shape[l[A]];let $=es(N,o.shape,o.dtype,l,k);d=a.makeTensorInfo(k,o.dtype);let R=a.texData.get(d.dataId);R.values=$}else d=Io(o,l,a);f.push(d),p=I.getInnerMostAxes(p.length,i)}I.assertAxesAreInnerMostDims("sum",p,i);let[h,g]=I.computeOutAndReduceShapes(d.shape,p),x=h;n&&(x=I.expandShapeToKeepDim(h,c));let b=YI(d,g,x,a);for(let S of f)a.disposeIntermediateTensorInfo(S);return b}};function CM(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,c=y.parseAxisParam(s,n.shape),p=c,l=I.getAxesPermutation(p,i),u=n;l!=null&&(u=_t({inputs:{x:n},backend:e,attrs:{perm:l}}),p=I.getInnerMostAxes(p.length,n.shape.length)),I.assertAxesAreInnerMostDims("min",p,i);let[m,f]=I.computeOutAndReduceShapes(u.shape,p),d=y.sizeFromShape(f),h=K({inputs:{x:u},backend:e,attrs:{shape:[-1,d]}}),g=De(h,h.dtype,"min",e),x;if(a){let b=I.expandShapeToKeepDim(m,c);x=K({inputs:{x:g},backend:e,attrs:{shape:b}})}else x=K({inputs:{x:g},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(h),e.disposeIntermediateTensorInfo(g),l!=null&&e.disposeIntermediateTensorInfo(u),x}var QI={kernelName:"Min",backendName:"webgl",kernelFunc:CM};var TM=Ni+`
  return min(a, b);
`,SM=`
  vec4 result = vec4(min(a, b));
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+Fr+`
  return result;
`,wM=Nt({opSnippet:TM,packedOpSnippet:SM,cpuKernelImpl:nN}),JI={kernelName:nn,backendName:"webgl",kernelFunc:wM};var em=class{constructor(t,e,o){this.variableNames=["x"],this.outputShape=e.map((l,u)=>l[0]+t[u]+l[1]);let n=t.length,s=mt(n),a=e.map(l=>l[0]).join(","),i=e.map((l,u)=>l[0]+t[u]).join(","),c=["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,n),p=o==="reflect"?0:1;if(n===1){this.userCode=`
        int start = ${a};
        int end = ${i};

        void main() {
          int outC = getOutputCoords();
          if (outC < start) {
            outC = start * 2 - outC - ${p};
          } else if(outC >= end) {
            outC = (end - 1) * 2 - outC + ${p};
          }
          setOutput(getX(outC - start));
        }
      `;return}this.userCode=`
      ${s} start = ${s}(${a});
      ${s} end = ${s}(${i});

      void main() {
        ${s} outC = getOutputCoords();
        for (int i = 0; i < ${n}; i++) {
          if (outC[i] < start[i]) {
            outC[i] = start[i] * 2 - outC[i] - ${p};
          } else if(outC[i] >= end[i]) {
            outC[i] = (end[i] - 1) * 2 - outC[i] + ${p};
          }
        }
        ${s} coords = outC - start;
        setOutput(getX(${c}));
      }
    `}};var rm=class{constructor(t,e,o){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=e.map((d,h)=>d[0]+t[h]+d[1]);let n=t.length,s=mt(n),a=e.map(d=>d[0]).join(","),i=e.map((d,h)=>d[0]+t[h]).join(","),c=Ht("rc",n),p=Ht("source",n),l=`${c[n-1]} < ${this.outputShape[n-1]}`,u=n===1?"source":`vec2(${p.slice(-2).join()})`,m=o==="reflect"?0:1,f="";if(n===1){let d=`
        ${s} source = rc;
        if (source < start) {
          source = start * 2 - source - ${m};
        } else if (source >= end) {
          source = (end - 1) * 2 - source + ${m};
        }
        source -= start;
      `;f=`
        ${s} rc = outputLoc;
        ${d}
        result[0] = getChannel(getX(${p.join()}), ${u});
        ${c[n-1]} += 1;
        if(${l}) {
          ${d}
          result[1] = getChannel(getX(${p.join()}), ${u});
        }
      `}else{let d=`
        ${s} source = rc;
        ${s} lt = ${s}(lessThan(source, start));
        ${s} gte = ${s}(greaterThanEqual(source, end));
        ${s} orig = 1 - (lt + gte);
        source = orig * source +
                lt * (start * 2 - source - ${m}) +
                gte * ((end - 1) * 2 - source + ${m});
        source -= start;
      `;f=`
        ${s} rc = outputLoc;
        ${d}
        result[0] = getChannel(getX(${p.join()}), ${u});
        ${c[n-1]} += 1;
        if(${l}) {
          ${d}
          result[1] = getChannel(getX(${p.join()}), ${u});
        }
        rc = outputLoc;
        ${c[n-2]} += 1;
        if(${c[n-2]} < ${this.outputShape[n-2]}) {
          ${d}
          result[2] = getChannel(getX(${p.join()}), ${u});
          ${c[n-1]} += 1;
          if(${l}) {
            ${d}
            result[3] = getChannel(getX(${p.join()}), ${u});
          }
        }
      `}this.userCode=`
      const ${s} start = ${s}(${a});
      const ${s} end = ${s}(${i});

      void main() {
        ${s} outputLoc = getOutputCoords();
        vec4 result = vec4(0.);
        ${f}
        setOutput(result);
      }
    `}};var NM=({inputs:r,backend:t,attrs:e})=>{let{x:o}=r,{paddings:n,mode:s}=e,a=F().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new rm(o.shape,n,s):new em(o.shape,n,s);return t.runWebGLProgram(a,[o],o.dtype)},tv={kernelName:ea,backendName:"webgl",kernelFunc:NM};var IM=`if (b == 0.0) return NAN;
  return mod(a, b);`,vM=`
  vec4 result = mod(a, b);
  bvec4 isNaN = equal(b, vec4(0.0));
  `+Fr+`
  return result;
`,kM=Nt({opSnippet:IM,packedOpSnippet:vM}),ev={kernelName:"Mod",backendName:"webgl",kernelFunc:kM};var om=class{constructor(t,e,o){this.variableNames=["probs"],this.customUniforms=[{name:"seed",type:"float"}],this.outputShape=[t,o],this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];

        float r = random(seed);
        float cdf = 0.0;

        for (int i = 0; i < ${e-1}; i++) {
          cdf += getProbs(batch, i);

          if (r < cdf) {
            setOutput(float(i));
            return;
          }
        }

        // If no other event happened, last event happened.
        setOutput(float(${e-1}));
      }
    `}};var EM=`
if (a == b) {
  return 1.0;
};
return a / b;`,$M=`
  // vec4 one = vec4(equal(a, b));
  // return one + (vec4(1.0) - one) * a / b;
  vec4 result = a / b;
  if(a.x == b.x) {
    result.x = 1.;
  }
  if(a.y == b.y) {
    result.y = 1.;
  }
  if(a.z == b.z) {
    result.z = 1.;
  }
  if(a.w == b.w) {
    result.w = 1.;
  }

  return result;
`,Ch=Nt({opSnippet:EM,packedOpSnippet:$M,checkOutOfBounds:!0}),rv={kernelName:zo,backendName:"webgl",kernelFunc:Ch};var ov="return a - b;",Th=Nt({opSnippet:ov,packedOpSnippet:ov,supportsComplex:!0,cpuKernelImpl:wN}),nv={kernelName:"Sub",backendName:"webgl",kernelFunc:Th};function Sh(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{dim:s}=o,a=y.parseAxisParam([s],n.shape),i=bh({inputs:{x:n},backend:e,attrs:{reductionIndices:a,keepDims:!1}}),c=I.expandShapeToKeepDim(i.shape,a),p=K({inputs:{x:i},backend:e,attrs:{shape:c}}),l=Th({inputs:{a:n,b:p},backend:e}),u=gh({inputs:{x:l},backend:e}),m=os({inputs:{x:u},backend:e,attrs:{axis:a,keepDims:!1}}),f=K({inputs:{x:m},backend:e,attrs:{shape:c}}),d=Ch({inputs:{a:u,b:f},backend:e});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(l),e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),d}var sv={kernelName:va,backendName:"webgl",kernelFunc:Sh};function RM(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{numSamples:s,seed:a,normalized:i}=o,c=i?n:Sh({inputs:{logits:n},backend:e,attrs:{dim:n.shape.length-1}}),p=c.shape[0],l=c.shape[1],u=new om(p,l,s),m=[[a]],f=e.runWebGLProgram(u,[c],"int32",m);return i||e.disposeIntermediateTensorInfo(c),f}var av={kernelName:ra,backendName:"webgl",kernelFunc:RM};var AM=te+`
  return -x;
`,FM=`
  vec4 result = -x;
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`;function DM(r){let{inputs:t,backend:e}=r,{x:o}=t;if(e.shouldExecuteOnCPU([o])){let s=e.texData.get(o.dataId),[a,i]=aN(s.values,o.shape,o.dtype);return e.makeTensorInfo(i,o.dtype,a)}let n;return F().getBool("WEBGL_PACK_UNARY_OPERATIONS")?n=new ze(o.shape,FM):n=new ge(o.shape,AM),e.runWebGLProgram(n,[o],o.dtype)}var iv={kernelName:"Neg",backendName:"webgl",kernelFunc:DM};var _M=pe.nonMaxSuppressionV3Impl;function OM(r){I.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:c}=o,p=e.readSync(n.dataId),l=e.readSync(s.dataId),{selectedIndices:u}=_M(p,l,a,i,c);return e.makeTensorInfo([u.length],"int32",new Int32Array(u))}var cv={kernelName:oa,backendName:"webgl",kernelFunc:OM};var PM=pe.nonMaxSuppressionV4Impl;function LM(r){I.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:c,padToMaxOutputSize:p}=o,l=e.readSync(n.dataId),u=e.readSync(s.dataId),{selectedIndices:m,validOutputs:f}=PM(l,u,a,i,c,p);return[e.makeTensorInfo([m.length],"int32",new Int32Array(m)),e.makeTensorInfo([],"int32",new Int32Array([f]))]}var pv={kernelName:na,backendName:"webgl",kernelFunc:LM};var BM=pe.nonMaxSuppressionV5Impl;function VM(r){I.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:c,softNmsSigma:p}=o,l=e.readSync(n.dataId),u=e.readSync(s.dataId),m=a,f=i,d=c,h=p,{selectedIndices:g,selectedScores:x}=BM(l,u,m,f,d,h);return[e.makeTensorInfo([g.length],"int32",new Int32Array(g)),e.makeTensorInfo([x.length],"float32",new Float32Array(x))]}var lv={kernelName:sa,backendName:"webgl",kernelFunc:VM};var nm=class{constructor(t,e,o,n){this.variableNames=["indices"],this.outputShape=[t,e],this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int index = round(getIndices(coords.x));
        setOutput(mix(float(${n}), float(${o}),
                      float(index == coords.y)));
      }
    `}};var MM=r=>{let{inputs:t,backend:e,attrs:o}=r,{indices:n}=t,{dtype:s,depth:a,onValue:i,offValue:c}=o,p=y.sizeFromShape(n.shape),l=new nm(p,a,i,c),u=K({inputs:{x:n},backend:e,attrs:{shape:[p]}}),m=e.runWebGLProgram(l,[u],s);e.disposeIntermediateTensorInfo(u);let f=[...n.shape,a],d=K({inputs:{x:m},backend:e,attrs:{shape:f}});return e.disposeIntermediateTensorInfo(m),d},uv={kernelName:ia,backendName:"webgl",kernelFunc:MM};function Fc(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="complex64"){let n=Xr({inputs:{input:o},backend:e}),s=Fc({inputs:{x:n},backend:e}),a=ss({inputs:{input:o},backend:e}),i=Fc({inputs:{x:a},backend:e}),c=ve({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),c}else return jr({attrs:{shape:o.shape,dtype:o.dtype,value:o.dtype==="string"?"":0},backend:e})}var mv={kernelName:za,backendName:"webgl",kernelFunc:Fc};function fv(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="string")throw new Error("onesLike is not supported under string dtype");if(o.dtype==="complex64"){let n=Xr({inputs:{input:o},backend:e}),s=fv({inputs:{x:n},backend:e}),a=ss({inputs:{input:o},backend:e}),i=Fc({inputs:{x:a},backend:e}),c=ve({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),c}else return jr({attrs:{shape:o.shape,dtype:o.dtype,value:1},backend:e})}var dv={kernelName:aa,backendName:"webgl",kernelFunc:fv};function zM(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o;if(t.length===1)return Wu({inputs:{input:t[0]},backend:e,attrs:{dim:n}});let s=t[0].shape,a=t[0].dtype;t.forEach(l=>{y.assertShapesMatch(s,l.shape,"All tensors passed to stack must have matching shapes"),y.assert(a===l.dtype,()=>"All tensors passed to stack must have matching dtypes")});let i=[],c=t.map(l=>{let u=Wu({inputs:{input:l},backend:e,attrs:{dim:n}});return i.push(u),u}),p=hh({inputs:c,backend:e,attrs:{axis:n}});return i.forEach(l=>e.disposeIntermediateTensorInfo(l)),p}var hv={kernelName:ca,backendName:"webgl",kernelFunc:zM};var sm=class{constructor(t,e,o){this.variableNames=["x"],this.customUniforms=[{name:"value",type:"float"}],this.outputShape=e.map((p,l)=>p[0]+t[l]+p[1]);let n=t.length,s=mt(n),a=e.map(p=>p[0]).join(","),i=e.map((p,l)=>p[0]+t[l]).join(","),c=["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,n);if(n===1){this.userCode=`
        int start = ${a};
        int end = ${i};

        void main() {
          int outC = getOutputCoords();
          if (outC < start || outC >= end) {
            setOutput(value);
          } else {
            setOutput(getX(outC - start));
          }
        }
      `;return}this.userCode=`
      ${s} start = ${s}(${a});
      ${s} end = ${s}(${i});

      void main() {
        ${s} outC = getOutputCoords();
        if (any(lessThan(outC, start)) || any(greaterThanEqual(outC, end))) {
          setOutput(value);
        } else {
          ${s} coords = outC - start;
          setOutput(getX(${c}));
        }
      }
    `}};var am=class{constructor(t,e,o){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"value",type:"float"}],this.outputShape=e.map((h,g)=>h[0]+t[g]+h[1]);let n=t.length,s=mt(n),a=e.map(h=>h[0]).join(","),i=e.map((h,g)=>h[0]+t[g]).join(","),c=Ht("rc",n),p=Ht("source",n),l=`${c[n-1]} < ${this.outputShape[n-1]}`,u=n===1?"source":`vec2(${p.slice(-2).join()})`,m=[`${s} rc = outputLoc;`,`${c[n-1]} += 1;
       if(${l}) {
      `,n===1?"":`}
       rc = outputLoc;
       ${c[n-2]} += 1;
       if(${c[n-2]} < ${this.outputShape[n-2]}) {`,n===1?"":`  ${c[n-1]} += 1;
         if(${l}) {`],f=n===1?"rc < start || rc >= end":"any(lessThan(rc, start)) || any(greaterThanEqual(rc, end))",d="";for(let h=0,g=n===1?2:4;h<g;h++)d+=`
        ${m[h]}
        if (${f}) {
          result[${h}] = float(value);
        } else {
          ${s} source = rc - start;
          result[${h}] = getChannel(getX(${p.join()}), ${u});
        }
      `;d+=n===1?"} ":"}}",this.userCode=`
      const ${s} start = ${s}(${a});
      const ${s} end = ${s}(${i});

      void main() {
        ${s} outputLoc = getOutputCoords();
        vec4 result = vec4(0.);
        ${d}
        setOutput(result);
      }
    `}};var wh=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{paddings:s,constantValue:a}=o;if(y.sizeFromShape(n.shape)===0){let p=s.map((l,u)=>l[0]+n.shape[u]+l[1]);return jr({backend:e,attrs:{shape:p,value:a,dtype:n.dtype}})}let i=F().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new am(n.shape,s,a):new sm(n.shape,s,a),c=[[a]];return e.runWebGLProgram(i,[n],n.dtype,c)},gv={kernelName:pa,backendName:"webgl",kernelFunc:wh};var WM=`
  if(a < 0.0 && floor(b) < b){
    return NAN;
  }
  if (b == 0.0) {
    return 1.0;
  }
  return (round(mod(b, 2.0)) != 1) ?
      pow(abs(a), b) : sign(a) * pow(abs(a), b);
`,GM=`
  // isModRound1 has 1 for components with round(mod(b, 2.0)) == 1, 0 otherwise.
  vec4 isModRound1 = vec4(equal(round(mod(b, 2.0)), ivec4(1)));
  vec4 multiplier = sign(a) * isModRound1 + (vec4(1.0) - isModRound1);
  vec4 result = multiplier * pow(abs(a), b);

  // Ensure that a^0 = 1, including 0^0 = 1 as this correspond to TF and JS
  bvec4 isExpZero = equal(b, vec4(0.0));
  result.r = isExpZero.r ? 1.0 : result.r;
  result.g = isExpZero.g ? 1.0 : result.g;
  result.b = isExpZero.b ? 1.0 : result.b;
  result.a = isExpZero.a ? 1.0 : result.a;

  bvec4 isNaN1 = lessThan(a, vec4(0.0));
  bvec4 isNaN2 = lessThan(floor(b), b);
  bvec4 isNaN = bvec4(isNaN1.x && isNaN2.x, isNaN1.y && isNaN2.y, isNaN1.z && isNaN2.z, isNaN1.w && isNaN2.w);
  `+Fr+`
  return result;
`,UM=Nt({opSnippet:WM,packedOpSnippet:GM}),xv={kernelName:"Pow",backendName:"webgl",kernelFunc:UM};function HM(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,c=[],p=y.parseAxisParam(s,n.shape),l=p,u=I.getAxesPermutation(l,i),m=n;u!=null&&(m=_t({inputs:{x:n},backend:e,attrs:{perm:u}}),l=I.getInnerMostAxes(l.length,i),c.push(m)),I.assertAxesAreInnerMostDims("prod",l,i);let f;if(e.shouldExecuteOnCPU([m])){let d=e.texData.get(m.dataId).values,{outVals:h,outShape:g,outDtype:x}=cN(m.shape,m.dtype,d,l);f=e.makeTensorInfo(g,x,h)}else{let[d,h]=I.computeOutAndReduceShapes(m.shape,l),g=y.sizeFromShape(h),x=K({inputs:{x:m},backend:e,attrs:{shape:[-1,g]}}),b=Rn(n.dtype),S=De(x,b,"prod",e);f=K({inputs:{x:S},backend:e,attrs:{shape:d}}),c.push(x),c.push(S)}if(a){c.push(f);let d=I.expandShapeToKeepDim(f.shape,p);f=K({inputs:{x:f},backend:e,attrs:{shape:d}})}return c.forEach(d=>e.disposeIntermediateTensorInfo(d)),f}var yv={kernelName:ua,backendName:"webgl",kernelFunc:HM};function KM(r){let{inputs:t,backend:e,attrs:o}=r,{paramsNestedSplits:n,paramsDenseValues:s,indices:a}=t,{outputRaggedRank:i}=o,c=n.map(x=>e.readSync(x.dataId)),p=n.map(x=>x.shape),l=e.readSync(s.dataId),u=e.readSync(a.dataId),[m,f,d]=pN(c,p,l,s.shape,s.dtype,u,a.shape,i),h=m.map(x=>e.makeTensorInfo([x.length],"int32",x)),g=e.makeTensorInfo(d,s.dtype,f);return h.concat([g])}var bv={kernelName:ma,backendName:"webgl",kernelFunc:KM};function qM(r){let{inputs:t,backend:e,attrs:o}=r,{shape:n,values:s,defaultValue:a,rowPartitionTensors:i}=t,{rowPartitionTypes:c}=o,p=e.readSync(n.dataId),l=e.readSync(s.dataId),u=e.readSync(a.dataId),m=i.map(g=>e.readSync(g.dataId)),f=i.map(g=>g.shape),[d,h]=lN(p,n.shape,l,s.shape,s.dtype,u,a.shape,m,f,c);return e.makeTensorInfo(d,s.dtype,h)}var Cv={kernelName:fa,backendName:"webgl",kernelFunc:qM};var Nh=r=>{let{backend:t,attrs:e}=r,{start:o,stop:n,step:s,dtype:a}=e,i=uN(o,n,s,a);return t.makeTensorInfo([i.length],a,i)},Tv={kernelName:da,backendName:"webgl",kernelFunc:Nh};var XM="return 1.0 / x;",jM=rt({opSnippet:XM}),Sv={kernelName:cn,backendName:"webgl",kernelFunc:jM};var YM=te+`
  return (x < 0.0) ? 0.0 : x;
`,ZM=`
  vec4 result = x * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,QM=rt({opSnippet:YM,packedOpSnippet:ZM}),wv={kernelName:pn,backendName:"webgl",kernelFunc:QM};var JM=te+`
  return (x < 0.0) ? 0.0 : min(6.0, x);
`,tz=`
  vec4 result = min(x, vec4(6.)) * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,ez=rt({opSnippet:JM,packedOpSnippet:tz}),Nv={kernelName:ln,backendName:"webgl",kernelFunc:ez};var im=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.outputShape=[];let[a,i,c,p]=t;this.outputShape=[a,e,o,p];let l=[n&&e>1?i-1:i,n&&o>1?c-1:c],u=[n&&e>1?e-1:e,n&&o>1?o-1:o],m;s?m="(vec2(yRC) + vec2(0.5)) * effectiveInputOverOutputRatioRC - vec2(0.5)":m="vec2(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec2 effectiveInputOverOutputRatioRC = vec2(
          ${l[0]/u[0]},
          ${l[1]/u[1]});
      const vec2 inputShapeRC = vec2(${i}.0, ${c}.0);

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        ivec2 yRC = coords.yz;

        // Fractional source index.
        vec2 sourceFracIndexRC = ${m};

        // Compute the four integer indices.
        ivec2 sourceFloorRC = ivec2(max(sourceFracIndexRC, vec2(0.0)));
        ivec2 sourceCeilRC = ivec2(
          min(inputShapeRC - 1.0, ceil(sourceFracIndexRC)));

        float topLeft = getA(b, sourceFloorRC.x, sourceFloorRC.y, d);
        float bottomLeft = getA(b, sourceCeilRC.x, sourceFloorRC.y, d);
        float topRight = getA(b, sourceFloorRC.x, sourceCeilRC.y, d);
        float bottomRight = getA(b, sourceCeilRC.x, sourceCeilRC.y, d);

        vec2 fracRC = sourceFracIndexRC - vec2(sourceFloorRC);

        float top = topLeft + (topRight - topLeft) * fracRC.y;
        float bottom = bottomLeft + (bottomRight - bottomLeft) * fracRC.y;
        float newValue = top + (bottom - top) * fracRC.x;

        setOutput(newValue);
      }
    `}};var cm=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[];let[a,i,c,p]=t;this.outputShape=[a,e,o,p];let l=[n&&e>1?i-1:i,n&&o>1?c-1:c],u=[n&&e>1?e-1:e,n&&o>1?o-1:o],m;s?m="(vec3(yRC) + vec3(0.5)) * effectiveInputOverOutputRatioRC - vec3(0.5)":m="vec3(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec3 effectiveInputOverOutputRatioRC = vec3(
          ${l[0]/u[0]},
          ${l[1]/u[1]},
          ${l[1]/u[1]});
      const vec3 inputShapeRC = vec3(${i}.0, ${c}.0,
                                     ${c}.0);

      float getAValue(int b, int r, int c, int d) {
        return getChannel(getA(b, r, c, d), vec2(c, d));
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        // Calculate values for next column in yRC.z.
        ivec3 yRC = coords.yzz + ivec3(0, 0, 1);

        // Fractional source index.
        vec3 sourceFracIndexRC = ${m};

        // Compute the four integer indices.
        ivec3 sourceFloorRC = ivec3(max(sourceFracIndexRC, vec3(0.0)));
        ivec3 sourceCeilRC = ivec3(
          min(inputShapeRC - 1.0, ceil(sourceFracIndexRC)));

        // Should we calculate next column and row elements in 2x2 packed cell.
        bool hasNextCol = d < ${p-1};
        bool hasNextRow = coords.z < ${o-1};

        // In parallel, construct four corners for all four components in
        // packed 2x2 cell.
        vec4 topLeft = vec4(
          getAValue(b, sourceFloorRC.x, sourceFloorRC.y, d),
          hasNextCol ? getAValue(b, sourceFloorRC.x, sourceFloorRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceFloorRC.x, sourceFloorRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceFloorRC.x, sourceFloorRC.z, d + 1) : 0.0);

        vec4 bottomLeft = vec4(
          getAValue(b, sourceCeilRC.x, sourceFloorRC.y, d),
          hasNextCol ? getAValue(b, sourceCeilRC.x, sourceFloorRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceCeilRC.x, sourceFloorRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceCeilRC.x, sourceFloorRC.z, d + 1) : 0.0);

        vec4 topRight = vec4(
          getAValue(b, sourceFloorRC.x, sourceCeilRC.y, d),
          hasNextCol ? getAValue(b, sourceFloorRC.x, sourceCeilRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceFloorRC.x, sourceCeilRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceFloorRC.x, sourceCeilRC.z, d + 1) : 0.0);

        vec4 bottomRight = vec4(
          getAValue(b, sourceCeilRC.x, sourceCeilRC.y, d),
          hasNextCol ? getAValue(b, sourceCeilRC.x, sourceCeilRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceCeilRC.x, sourceCeilRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceCeilRC.x, sourceCeilRC.z, d + 1) : 0.0);

        vec3 fracRC = sourceFracIndexRC - vec3(sourceFloorRC);

        vec4 top = mix(topLeft, topRight, fracRC.yyzz);
        vec4 bottom = mix(bottomLeft, bottomRight, fracRC.yyzz);
        vec4 newValue = mix(top, bottom, fracRC.x);

        setOutput(newValue);
      }
    `}};function rz(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o,[c,p]=i,l=F().getBool("WEBGL_PACK_IMAGE_OPERATIONS")?new cm(n.shape,c,p,s,a):new im(n.shape,c,p,s,a);return e.runWebGLProgram(l,[n],"float32")}var Iv={kernelName:ya,backendName:"webgl",kernelFunc:rz};var pm=class{constructor(t,e,o){this.variableNames=["dy"],this.outputShape=[],this.outputShape=e;let[,n,s]=e,[,a,i]=t,c=[o&&a>1?n-1:n,o&&i>1?s-1:s],p=[o&&a>1?a-1:a,o&&i>1?i-1:i],l=c[0]/p[0],u=c[1]/p[1],m=1/l,f=1/u,d=Math.ceil(m)*2+2,h=Math.ceil(f)*2+2;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        int r = coords[1];
        int c = coords[2];

        float accumulator = 0.0;

        const float heightScale = float(${l});
        const float widthScale = float(${u});

        const float invHeightScale = float(${m});
        const float invWidthScale = float(${f});

        const int winHeight = int(${d});
        const int winWidth = int(${h});

        // Compute bounds for where in dy we will look
        float startRLerp = floor(float(r) * invHeightScale);
        int startDyR = int(startRLerp - float(winHeight / 2));

        float startCLerp = floor(float(c) * invWidthScale);
        int startDyC = int(startCLerp - float(winWidth / 2));

        // Loop over dy
        for (int dyROffset = 0; dyROffset < winHeight; dyROffset++) {
          int dyR = dyROffset + startDyR;

          // Guard against the window exceeding the bounds of dy
          if (dyR < 0 || dyR >= ${a}) {
            continue;
          }

          for (int dyCOffset = 0; dyCOffset < winWidth; dyCOffset++) {
            int dyC = dyCOffset + startDyC;

            // Guard against the window exceeding the bounds of dy
            if (dyC < 0 || dyC >= ${i}) {
              continue;
            }

            float dxR = float(dyR) * heightScale;
            int topDxRIndex = int(floor(dxR));
            int bottomDxRIndex = int(min(ceil(dxR), ${n-1}.0));
            float dxRLerp = dxR - float(topDxRIndex);
            float inverseDxRLerp = 1.0 - dxRLerp;

            float dxC = float(dyC) * widthScale;
            int leftDxCIndex = int(floor(dxC));
            int rightDxCIndex = int(min(ceil(dxC), ${s-1}.0));
            float dxCLerp = dxC - float(leftDxCIndex);
            float inverseDxCLerp = 1.0 - dxCLerp;

            if (r == topDxRIndex && c == leftDxCIndex) {
              // topLeft
              accumulator +=
                getDy(b, dyR, dyC, d) * inverseDxRLerp * inverseDxCLerp;
            }

            if (r == topDxRIndex && c == rightDxCIndex) {
              // topRight
              accumulator += getDy(b, dyR, dyC, d) * inverseDxRLerp * dxCLerp;
            }

            if (r == bottomDxRIndex && c == leftDxCIndex) {
              // bottomLeft
              accumulator += getDy(b, dyR, dyC, d) * dxRLerp * inverseDxCLerp;
            }

            if (r == bottomDxRIndex && c == rightDxCIndex) {
              // bottomRight
              accumulator += getDy(b, dyR, dyC, d) * dxRLerp * dxCLerp;
            }
          }
        }
        // End loop over dy

        setOutput(accumulator);
      }
    `}};function oz(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o,i=new pm(s.shape,n.shape,a);return e.runWebGLProgram(i,[s],s.dtype)}var vv={kernelName:jc,backendName:"webgl",kernelFunc:oz};var lm=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.outputShape=[];let[a,i,c,p]=t;this.outputShape=[a,e,o,p];let l=[n&&e>1?i-1:i,n&&o>1?c-1:c],u=[n&&e>1?e-1:e,n&&o>1?o-1:o],m=n?"0.5":"0.0",f;s?f="max((vec2(yRC) + vec2(0.5)) * effectiveInputOverOutputRatioRC, vec2(0.0))":f="vec2(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec2 effectiveInputOverOutputRatioRC = vec2(
          ${l[0]/u[0]},
          ${l[1]/u[1]});
      const vec2 inputShapeRC = vec2(${i}.0, ${c}.0);

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        ivec2 yRC = coords.yz;

        // Fractional source index.
        vec2 sourceFracIndexRC = ${f};

        // Compute the coordinators of nearest neighbor point.
        ivec2 sourceNearestRC = ivec2(
          min(inputShapeRC - 1.0, floor(sourceFracIndexRC + ${m})));
        float newValue = getA(b, sourceNearestRC.x, sourceNearestRC.y, d);

        setOutput(newValue);
      }
    `}};var um=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[];let[a,i,c,p]=t;this.outputShape=[a,e,o,p];let l=[n&&e>1?i-1:i,n&&o>1?c-1:c],u=[n&&e>1?e-1:e,n&&o>1?o-1:o],m=n?"0.5":"0.0",f;s?f="max((vec3(yRC) + vec3(0.5)) * effectiveInputOverOutputRatioRC, vec3(0.0))":f="vec3(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec3 effectiveInputOverOutputRatioRC = vec3(
          ${l[0]/u[0]},
          ${l[1]/u[1]},
          ${l[1]/u[1]});
      const vec3 inputShapeRC = vec3(${i}.0, ${c}.0,
                                     ${c}.0);

      float getAValue(int b, int r, int c, int d) {
        return getChannel(getA(b, r, c, d), vec2(c, d));
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        // Calculate values for next column in yRC.z.
        ivec3 yRC = coords.yzz + ivec3(0, 0, 1);

        // Fractional source index.
        vec3 sourceFracIndexRC = ${f};

        // Compute the coordinators of nearest neighbor point.
        ivec3 sourceNearestRC = ivec3(
          min(inputShapeRC - 1.0, floor(sourceFracIndexRC + ${m})));

        // Should we calculate next column and row elements in 2x2 packed cell.
        bool hasNextCol = d < ${p-1};
        bool hasNextRow = coords.z < ${o-1};

        vec4 newValue = vec4(
          getAValue(b, sourceNearestRC.x, sourceNearestRC.y, d),
          hasNextCol ? getAValue(b, sourceNearestRC.x, sourceNearestRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceNearestRC.x, sourceNearestRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceNearestRC.x, sourceNearestRC.z, d + 1) : 0.0);

        setOutput(newValue);
      }
    `}};function nz(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o,[c,p]=i,l=F().getBool("WEBGL_PACK_IMAGE_OPERATIONS")?new um(n.shape,c,p,s,a):new lm(n.shape,c,p,s,a);return e.runWebGLProgram(l,[n],n.dtype)}var kv={kernelName:xa,backendName:"webgl",kernelFunc:nz};var mm=class{constructor(t,e,o){this.variableNames=["dy"],this.outputShape=[],this.outputShape=e;let[,n,s]=e,[,a,i]=t,c=[o&&a>1?n-1:n,o&&i>1?s-1:s],p=[o&&a>1?a-1:a,o&&i>1?i-1:i],l=c[0]/p[0],u=c[1]/p[1],m=1/l,f=1/u,d=Math.ceil(m)*2+2,h=Math.ceil(f)*2+2;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        int r = coords[1];
        int c = coords[2];

        float accumulator = 0.0;

        const float heightScale = float(${l});
        const float widthScale = float(${u});

        const float invHeightScale = float(${m});
        const float invWidthScale = float(${f});

        const int winHeight = int(${d});
        const int winWidth = int(${h});

        // Compute bounds for where in dy we will look
        float startRLerp = floor(float(r) * invHeightScale);
        int startDyR = int(floor(startRLerp - float(winHeight / 2)));

        float startCLerp = floor(float(c) * invWidthScale);
        int startDyC = int(floor(startCLerp - float(winWidth / 2)));

        // Loop over dy
        for (int dyROffset = 0; dyROffset < winHeight; dyROffset++) {
          int dyR = dyROffset + startDyR;

          // Guard against the window exceeding the bounds of dy
          if (dyR < 0 || dyR >= ${a}) {
            continue;
          }

          for (int dyCOffset = 0; dyCOffset < winWidth; dyCOffset++) {
            int dyC = dyCOffset + startDyC;

            // Guard against the window exceeding the bounds of dy
            if (dyC < 0 || dyC >= ${i}) {
              continue;
            }

            float sourceFracRow =
              float(${c[0]}) *
                (float(dyR) / float(${p[0]}));

            float sourceFracCol =
                float(${c[1]}) *
                  (float(dyC) / float(${p[1]}));

            int sourceNearestRow = int(min(
                float(int(${n}) - 1),
                ${o} ? float(round(sourceFracRow)) :
                                  float(floor(sourceFracRow))));

            int sourceNearestCol = int(min(
                float(int(${s}) - 1),
                ${o} ? float(round(sourceFracCol)) :
                                  float(floor(sourceFracCol))));

            if (r == sourceNearestRow && c == sourceNearestCol) {
              accumulator += getDy(b, dyR, dyC, d);
            }
          }
        }
        // End loop over dy

        setOutput(accumulator);
      }
    `}};function sz(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o,i=new mm(s.shape,n.shape,a);return e.runWebGLProgram(i,[s],s.dtype)}var Ev={kernelName:Xc,backendName:"webgl",kernelFunc:sz};var fm=class{constructor(t,e){this.variableNames=["x"];let o=t.length;if(o>4)throw new Error(`WebGL backend: Reverse of rank-${o} tensor is not yet supported`);if(this.outputShape=t,o===1){this.userCode=`
        void main() {
          int coord = getOutputCoords();
          setOutput(getX(${t[0]} - coord - 1));
        }
      `;return}let n=i=>e.indexOf(i)!==-1&&t[i]!==1?`${t[i]} - coords[${i}] - 1`:`coords[${i}]`,s=t.map((i,c)=>n(c)).join(","),a=mt(o);this.userCode=`
      void main() {
        ${a} coords = getOutputCoords();
        setOutput(getX(${s}));
      }
    `}};var dm=class{constructor(t,e){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0;let o=t.length;if(o>4)throw new Error(`WebGL backend: Reverse of rank-${o} tensor is not yet supported`);this.outputShape=t;let n=Ht("rc",o),s=`${n[o-1]} + 1 < ${this.outputShape[o-1]}`,a=`${n[o-2]} + 1 < ${this.outputShape[o-2]}`,i=mt(o);o===1?this.userCode=`
        void main(){
          int rc = getOutputCoords();
          vec4 result = vec4(0.);
          result.r = getChannel(getX(${t[0]} - rc - 1),
            ${t[0]} - rc - 1);
          if(${s}){
              result.g = getChannel(getX(${t[0]} - (rc  + 1) - 1),
                ${t[0]} - (rc  + 1) - 1);
          }
          setOutput(result);
        }
      `:this.userCode=`
        void main() {
          ${i} rc = getOutputCoords();
          vec4 result = vec4(0.);
          result.r = ${c(n.slice())};
          if(${s}){
            result.g = ${p(n.slice())};
          }
          if(${a}) {
            result.b = ${l(n.slice())};
            if(${s}) {
              result.a = ${u(n.slice())};
            }
          }
          setOutput(result);
        }
    `;function c(d){return m(d)}function p(d){return d[o-1]="("+d[o-1]+" + 1)",m(d)}function l(d){return d[o-2]="("+d[o-2]+" + 1)",m(d)}function u(d){return d[o-1]="("+d[o-1]+" + 1)",d[o-2]="("+d[o-2]+" + 1)",m(d)}function m(d){let h=t.map((b,S)=>f(S,d)),g=h.join(","),x=h.slice(-2).join(",");return`getChannel(getX(${g}), vec2(${x}))`}function f(d,h){return e.indexOf(d)!==-1&&t[d]!==1?`${t[d]} - ${h[d]} - 1`:`${h[d]}`}}};function az(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dims:s}=o,a=n.shape.length,i=y.parseAxisParam(s,n.shape);if(a===0)return Kt({inputs:{x:n},backend:e});let c=F().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new dm(n.shape,i):new fm(n.shape,i);return e.runWebGLProgram(c,[n],n.dtype)}var $v={kernelName:ba,backendName:"webgl",kernelFunc:az};var hm=class{constructor(t,e){this.variableNames=["Image"],this.outputShape=[],this.customUniforms=[{name:"params",type:"vec4"}];let o=t[1],n=t[2];this.outputShape=t;let s="";typeof e=="number"?s=`float outputValue = ${e.toFixed(2)};`:s=`
        vec3 fill = vec3(${e.join(",")});
        float outputValue = fill[coords[3]];`,this.userCode=`
        void main() {
          ivec4 coords = getOutputCoords();
          int x = coords[2];
          int y = coords[1];
          float coordXFloat = (float(x) - params[0]) * params[3] -
            (float(y) - params[1]) * params[2];
          float coordYFloat = (float(x) - params[0]) * params[2] +
            (float(y) - params[1]) * params[3];
          int coordX = int(round(coordXFloat + params[0]));
          int coordY = int(round(coordYFloat + params[1]));
          ${s}
          if(coordX >= 0 && coordX < ${n} && coordY >= 0 && coordY < ${o}) {
            outputValue = getImage(coords[0], coordY, coordX, coords[3]);
          }
          setOutput(outputValue);
        }
    `}};var Rv={kernelName:Wa,backendName:"webgl",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{image:o}=r,{radians:n,fillValue:s,center:a}=t,i=e,c=new hm(o.shape,s),[p,l]=I.getImageCenter(a,o.shape[1],o.shape[2]),u=[[p,l,Math.sin(n),Math.cos(n)]];return i.runWebGLProgram(c,[o],o.dtype,u)}};var iz=`
  // OpenGL ES does not support round function.
  // The algorithm is based on banker's rounding.
  float base = floor(x);
  if ((x - base) < 0.5) {
    return floor(x);
  } else if ((x - base) > 0.5) {
    return ceil(x);
  } else {
    if (mod(base, 2.0) == 0.0) {
      return base;
    } else {
      return base + 1.0;
    }
  }
`,cz=rt({opSnippet:iz}),Av={kernelName:un,backendName:"webgl",kernelFunc:cz};var pz="return inversesqrt(x);",lz=rt({opSnippet:pz,cpuKernelImpl:mN}),Fv={kernelName:mn,backendName:"webgl",kernelFunc:lz};var Fi=class{constructor(t,e,o,n,s,a,i=!0){this.variableNames=["updates","indices","defaultValue"],this.outputShape=a;let c=mt(s.length),p=mt(a.length),l="";o===1?l="i":o===2&&(l="i, j");let u=`getIndices(${l})`,m="";n===1?m="i":n===2&&(m="i, coords[1]");let f=`getUpdates(${m})`,d=e>1?"strides[j]":"strides";this.userCode=`
        ${c} strides = ${c}(${s});

        void main() {
          ${p} coords = getOutputCoords();
          float sum = 0.0;
          bool found = false;
          for (int i = 0; i < ${t}; i++) {
            int flattenedIndex = 0;
            for (int j = 0; j < ${e}; j++) {
              int index = round(${u});
              flattenedIndex += index * ${d};
            }
            if (flattenedIndex == coords[0]) {
              sum += ${f};
              found = true;
            }
          }
          setOutput(mix(getDefaultValue(), sum, float(found)));
        }
      `}};function uz(r){let{inputs:t,backend:e,attrs:o}=r,{indices:n,updates:s}=t,{shape:a}=o,{sliceRank:i,numUpdates:c,sliceSize:p,strides:l,outputSize:u}=I.calculateShapes(s,n,a),m=[u/p,p];if(u===0)return e.makeTensorInfo(a,n.dtype);let f=K({inputs:{x:n},backend:e,attrs:{shape:[c,i]}}),d=K({inputs:{x:s},backend:e,attrs:{shape:[c,p]}}),h=e.makeTensorInfo([],"float32",new Float32Array([0])),g=new Fi(c,i,f.shape.length,d.shape.length,l,m),x=e.runWebGLProgram(g,[d,f,h],d.dtype),b=K({inputs:{x},backend:e,attrs:{shape:a}});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(x),e.disposeIntermediateTensorInfo(h),b}var Dv={kernelName:Ca,backendName:"webgl",kernelFunc:uz};var gm=class{constructor(t,e,o,n){this.variableNames=["sortedSequence","values"],this.customUniforms=[{name:"numInputs",type:"int"}],this.outputShape=[t,o];let s="while (left < right) {",a=`for (int i = 0; i < ${Math.ceil(Math.log2(e+1))}; ++i) { if (left >= right) break;`,i=F().getNumber("WEBGL_VERSION")===2?s:a,c=n==="left"?"<":"<=";this.userCode=`
       int findBound(int batch, float value) {
         int left = 0;
         int right = numInputs;
         int mid;
         ${i}
           mid = (left + right) / 2;
           if (getSortedSequence(batch, mid) ${c} value) {
             left = mid + 1;
           } else {
             right = mid;
           }
         }
         return right;
       }

       void main() {
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int valueIndex = coords[1];

         float value = getValues(batch, valueIndex);

         setOutput(float(findBound(batch, value)));
       }
     `}};function mz(r){let{inputs:t,backend:e,attrs:o}=r,{sortedSequence:n,values:s}=t,{side:a}=o,i=new gm(n.shape[0],n.shape[1],s.shape[1],a),c=[[n.shape[1]]];return e.runWebGLProgram(i,[n,s],"int32",c)}var _v={kernelName:Ta,backendName:"webgl",kernelFunc:mz};var xm=class{constructor(t,e,o){this.variableNames=["c","a","b"],this.outputShape=e;let n,s;if(o>4)throw Error(`Where for rank ${o} is not yet supported`);if(o===1)s="resRC",n="resRC";else{let i=["resRC.x","resRC.y","resRC.z","resRC.w"],c=[],p=[];for(let l=0;l<e.length;l++)p.push(`${i[l]}`),l<t&&c.push(`${i[l]}`);n=c.join(),s=p.join()}let a=mt(o);this.userCode=`
      void main() {
        ${a} resRC = getOutputCoords();
        float cVal = getC(${n});
        if (cVal >= 1.0) {
          setOutput(getA(${s}));
        } else {
          setOutput(getB(${s}));
        }
      }
    `}};function fz(r){let{inputs:t,backend:e}=r,{condition:o,t:n,e:s}=t,a=new xm(o.shape.length,n.shape,n.shape.length);return e.runWebGLProgram(a,[o,n,s],Yt(n.dtype,s.dtype))}var Ov={kernelName:Sa,backendName:"webgl",kernelFunc:fz};var dz=`
  // Stable and Attracting Fixed Point (0, 1) for Normalized Weights.
  // see: https://arxiv.org/abs/1706.02515
  float scaleAlpha = ${I.SELU_SCALEALPHA};
  float scale = ${I.SELU_SCALE};
  return (x >= 0.0) ? scale * x : scaleAlpha * (exp(x) - 1.0);
`,hz=rt({opSnippet:dz}),Pv={kernelName:fn,backendName:"webgl",kernelFunc:hz};var gz=nr+`
  return 1.0 / (1.0 + exp(-1.0 * x));
`,xz=`
  vec4 result = 1.0 / (1.0 + exp(-1.0 * x));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,yz=rt({opSnippet:gz,packedOpSnippet:xz,cpuKernelImpl:dN}),Lv={kernelName:gn,backendName:"webgl",kernelFunc:yz};var bz=`
  if (isnan(x)) { return 0.0; }
  return sign(x);
`,Cz=rt({opSnippet:bz}),Bv={kernelName:hn,backendName:"webgl",kernelFunc:Cz};var Tz=nr+`
  return sin(x);
`,Sz=rt({opSnippet:Tz}),Vv={kernelName:"Sin",backendName:"webgl",kernelFunc:Sz};var wz=`
  float e2x = exp(x);
  return (e2x - 1.0 / e2x) / 2.0;
`,Nz=rt({opSnippet:wz}),Mv={kernelName:dn,backendName:"webgl",kernelFunc:Nz};var Iz=`
  float epsilon = 1.1920928955078125e-7;
  float threshold = log(epsilon) + 2.0;

  bool too_large = x > -threshold;
  bool too_small = x < threshold;

  float result;
  float exp_x = exp(x);

  if (too_large){
    result = x;
  }
  else if (too_small){
    result = exp_x;
  }
  else{
    result = log(exp_x + 1.0);
  }
  return result;
`,vz=rt({opSnippet:Iz}),zv={kernelName:xn,backendName:"webgl",kernelFunc:vz};var kz=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,paddings:a}=o;y.assert(n.shape.length<=4,()=>"spaceToBatchND for rank > 4 with a WebGL backend not implemented yet");let i=s.reduce((x,b)=>x*b),c=[[0,0]];c.push(...a);for(let x=1+s.length;x<n.shape.length;++x)c.push([0,0]);let p=[],l=wh({inputs:{x:n},backend:e,attrs:{paddings:c,constantValue:0}}),u=I.getReshaped(l.shape,s,i,!1),m=I.getPermuted(u.length,s.length,!1),f=I.getReshapedPermuted(l.shape,s,i,!1),d=K({inputs:{x:l},backend:e,attrs:{shape:u}}),h=_t({inputs:{x:d},backend:e,attrs:{perm:m}}),g=K({inputs:{x:h},backend:e,attrs:{shape:f}});return p.push(l),p.push(d),p.push(h),p.forEach(x=>e.disposeIntermediateTensorInfo(x)),g},Wv={kernelName:Na,backendName:"webgl",kernelFunc:kz};function Ez(r){let{inputs:t,backend:e}=r,{indices:o,values:n,denseShape:s,defaultValue:a}=t;if(s.shape.length!==1)throw new Error(`Dense shape must be a vector, saw:
         ${s.shape}`);if(o.shape.length!==2)throw new Error(`Indices must be a matrix, saw:
         ${o.shape}`);if(n.shape.length!==1)throw new Error(`Values must be a vector, saw:
         ${n.shape}`);if(a.shape.length!==0)throw new Error(`Default value must be a scalar, saw:
        ${a.shape}`);let i=e.readSync(o.dataId),c=e.readSync(n.dataId),p=e.readSync(s.dataId),l=e.readSync(a.dataId)[0],[u,m,f,d,h]=gN(i,o.shape,o.dtype,c,n.dtype,p,l);return[e.makeTensorInfo(m,o.dtype,u),e.makeTensorInfo([m[0]],n.dtype,f),e.makeTensorInfo([d.length],"bool",new Uint8Array(d.map(g=>Number(g)))),e.makeTensorInfo([h.length],o.dtype,new Int32Array(h))]}var Gv={kernelName:ka,backendName:"webgl",kernelFunc:Ez};function $z(r){let{inputs:t,backend:e}=r,{inputIndices:o,inputShape:n,newShape:s}=t;if(o.shape.length!==2)throw new Error(`Input indices should be a matrix but received shape ${o.shape}`);if(n.shape.length!==1)throw new Error(`Input shape should be a vector but received shape ${n.shape}`);if(s.shape.length!==1)throw new Error(`Target shape should be a vector but received shape ${s.shape}`);let a=Array.from(e.readSync(n.dataId)),i=e.readSync(o.dataId),c=Array.from(e.readSync(s.dataId)),[p,l,u]=xN(i,o.shape,o.dtype,a,c);return[e.makeTensorInfo(l,o.dtype,p),e.makeTensorInfo([u.length],s.dtype,new Int32Array(u))]}var Uv={kernelName:Ea,backendName:"webgl",kernelFunc:$z};function Rz(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
              ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
              ${s.shape}`);let a=e.readSync(o.dataId),i=e.readSync(n.dataId),c=e.readSync(s.dataId),[p,l]=tu(a,o.shape,o.dtype,i,c,!0);return e.makeTensorInfo(l,o.dtype,p)}var Hv={kernelName:$a,backendName:"webgl",kernelFunc:Rz};function Az(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
             ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
             ${s.shape}`);let a=e.readSync(o.dataId),i=e.readSync(n.dataId),c=e.readSync(s.dataId),[p,l]=tu(a,o.shape,o.dtype,i,c);return e.makeTensorInfo(l,o.dtype,p)}var Kv={kernelName:Ra,backendName:"webgl",kernelFunc:Az};function Fz(r){let{inputs:t,backend:e,attrs:o}=r,{sparseIndices:n,sparseValues:s,defaultValue:a}=t,{outputShape:i}=o,{sliceRank:c,numUpdates:p,sliceSize:l,strides:u,outputSize:m}=I.calculateShapes(s,n,i),f=!1;if(s.dtype==="string"){let x=e.bufferSync(n),b=e.bufferSync(s),S=y.decodeString(e.readSync(a.dataId)[0]),N=fN(x,b,i,m,l,p,c,u,S,f);return e.makeTensorInfo(i,N.dtype,N.values)}let d=new Fi(p,c,n.shape.length,s.shape.length,u,[m,1],f),h=e.runWebGLProgram(d,[s,n,a],s.dtype),g=K({inputs:{x:h},backend:e,attrs:{shape:i}});return e.disposeIntermediateTensorInfo(h),g}var qv={kernelName:Aa,backendName:"webgl",kernelFunc:Fz};function Dz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{numOrSizeSplits:s,axis:a}=o,i=y.parseAxisParam(a,n.shape)[0],c=I.prepareSplitSize(n,s,i),p=n.shape.length,l=new Array(p).fill(0),u=n.shape.slice();return c.map(m=>{let f=[...u];f[i]=m;let d=hr({inputs:{x:n},backend:e,attrs:{begin:l,size:f}});return l[i]+=m,d})}var Xv={kernelName:Ia,backendName:"webgl",kernelFunc:Dz};var jv="return sqrt(x);",_z=rt({opSnippet:jv,packedOpSnippet:jv,cpuKernelImpl:yN}),Yv={kernelName:yn,backendName:"webgl",kernelFunc:_z};var Oz="return x * x;",Pz=rt({opSnippet:Oz}),Zv={kernelName:Yc,backendName:"webgl",kernelFunc:Pz};var Qv="return (a - b) * (a - b);",Lz=Nt({opSnippet:Qv,packedOpSnippet:Qv}),Jv={kernelName:bn,backendName:"webgl",kernelFunc:Lz};function Bz({inputs:r,attrs:t,backend:e}){let{x:o}=r,n=te+`
    return x > 0.0 ? 1.0 : float(${t.alpha});
  `,s=new ge(o.shape,n);return e.runWebGLProgram(s,[o],o.dtype)}var tk={kernelName:Tn,backendName:"webgl",kernelFunc:Bz};var ym=class{constructor(t,e,o){this.variableNames=["x"],this.outputShape=o;let n=o.length,s=mt(o.length),a=mt(o.length),i="";if(n===1)i="coords * strides + begin";else{let c=0;i=o.map((p,l)=>(c++,o.length===1?`coords * strides[${l}] + begin[${l}]`:`coords[${c-1}] * strides[${l}] + begin[${l}]`)).join(",")}this.userCode=`
      ${s} begin = ${s}(${t});
      ${s} strides = ${s}(${e});

      void main() {
        ${a} coords = getOutputCoords();
        setOutput(getX(${i}));
      }
    `}};function Vz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,end:a,strides:i,beginMask:c,endMask:p,ellipsisMask:l,newAxisMask:u,shrinkAxisMask:m}=o,{finalShapeSparse:f,finalShape:d,isIdentity:h,sliceDim0:g,isSimpleSlice:x,begin:b,end:S,strides:N}=ne.sliceInfo(n.shape,s,a,i,c,p,l,u,m),k;if(h)k=K({inputs:{x:n},backend:e,attrs:{shape:d}});else if(g||x){y.assert(n.shape.length>=1,()=>`Input must have rank at least 1, got: ${n.shape.length}`);let R=ne.computeOutShape(b,S,N),A=hr({inputs:{x:n},backend:e,attrs:{begin:b,size:R}});k=K({inputs:{x:A},backend:e,attrs:{shape:d}}),e.disposeIntermediateTensorInfo(A)}else if(e.shouldExecuteOnCPU([n])){let A=e.readSync(n.dataId),D=tt(n.shape,n.dtype,A),_=bN(f,D,N,b);k=e.makeTensorInfo(d,n.dtype,_.values)}else{let A=new ym(b,N,f);k=e.runWebGLProgram(A,[n],n.dtype)}let $=K({inputs:{x:k},backend:e,attrs:{shape:d}});return e.disposeIntermediateTensorInfo(k),$}var ek={kernelName:Fa,backendName:"webgl",kernelFunc:Vz};function Mz(r){let{inputs:t,backend:e,attrs:o}=r,{separator:n,nGramWidths:s,leftPad:a,rightPad:i,padWidth:c,preserveShortSequences:p}=o,{data:l,dataSplits:u}=t,m=e.readSync(l.dataId),f=e.readSync(u.dataId),[d,h]=CN(m,f,n,s,a,i,c,p);return[e.makeTensorInfo([d.length],"string",d),e.makeTensorInfo(u.shape,"int32",h)]}var rk={kernelName:Da,backendName:"webgl",kernelFunc:Mz};function zz(r){let{inputs:t,backend:e,attrs:o}=r,{skipEmpty:n}=o,{input:s,delimiter:a}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(s.shape.length!==1)throw new Error(`Input must be a vector, got shape: ${s.shape}`);if(a.shape.length!==0)throw new Error(`Delimiter must be a scalar, got shape: ${a.shape}`);let i=e.readSync(s.dataId),c=e.readSync(a.dataId)[0],[p,l,u]=TN(i,c,n),m=l.length;return[e.makeTensorInfo([m,2],"int32",p),e.makeTensorInfo([m],"string",l),e.makeTensorInfo([2],"int32",new Int32Array(u))]}var ok={kernelName:_a,backendName:"webgl",kernelFunc:zz};function Wz(r){let{inputs:t,backend:e,attrs:o}=r,{numBuckets:n}=o,{input:s}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(n<=0)throw new Error("Number of buckets must be at least 1");let a=e.readSync(s.dataId),i=SN(a,n);return e.makeTensorInfo(s.shape,"int32",i)}var nk={kernelName:Oa,backendName:"webgl",kernelFunc:Wz};var Gz="return tan(x);",Uz=rt({opSnippet:Gz}),sk={kernelName:"Tan",backendName:"webgl",kernelFunc:Uz};var Hz=`
  float e2x = exp(-2.0 * abs(x));
  return sign(x) * (1.0 - e2x) / (1.0 + e2x);
`,Kz=rt({opSnippet:Hz}),ak={kernelName:Cn,backendName:"webgl",kernelFunc:Kz};var bm=class{constructor(t,e){this.variableNames=["A"];let o=new Array(t.length);for(let a=0;a<o.length;a++)o[a]=t[a]*e[a];this.outputShape=o,this.rank=o.length;let n=mt(this.rank),s=qz(t);this.userCode=`
      void main() {
        ${n} resRC = getOutputCoords();
        setOutput(getA(${s}));
      }
    `}};function qz(r){let t=r.length;if(t>5)throw Error(`Tile for rank ${t} is not yet supported`);if(t===1)return`imod(resRC, ${r[0]})`;let e=["resRC.x","resRC.y","resRC.z","resRC.w","resRC.u"],o=[];for(let n=0;n<r.length;n++)o.push(`imod(${e[n]}, ${r[n]})`);return o.join()}function Ih(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reps:s}=o;if(n.dtype==="string"||n.shape.length>5){let c=e.readSync(n.dataId),p=n.dtype==="string"?c.map(m=>y.decodeString(m)):c,l=tt(n.shape,n.dtype,p),u=NN(l,s);return e.makeTensorInfo(u.shape,u.dtype,u.values)}let a=new bm(n.shape,s);return e.runWebGLProgram(a,[n],n.dtype)}var ik={kernelName:no,backendName:"webgl",kernelFunc:Ih};var Cm=class{constructor(t){this.variableNames=["x","indices"],this.customUniforms=[{name:"n",type:"int"},{name:"firstPass",type:"int"},{name:"negativeInf",type:"float"},{name:"dir",type:"int"},{name:"inc",type:"int"}],this.outputShape=t,this.userCode=`
       void main() {
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int elemIdx = coords[1];

         // We compare elements pair-wise within a group of size 2 * inc.
         // The comparing rule for each group alternates between ascending
         // and descending. Within each group, we compare each pair at
         // positions i and i+inc. To decide whether an element at position i
         // is x0 or x1, we mod it by 2 * inc, if the result is smaller than
         // inc, it is in the first half of the group, we denote it as x0,
         // otherwise we denote it as x1.
         // For example, as shown in the Bitonic top K paper referenced above,
         // Figure5(a) shows that element[1] is in the
         // second half of the group when group size is 2, but it is in the
         // first half of the group when group size is 4.

         bool isFirstInPair = imod(elemIdx, 2 * inc) < inc;
         int i = isFirstInPair ? elemIdx : elemIdx - inc;

         int i0 = firstPass == 1 ? i : int(getIndices(batch, i));
         int i1 = firstPass == 1 ? i + inc : int(getIndices(batch, i + inc));
         float x0 = i0 < n ? getX(batch, i0) : negativeInf;
         float x1 = i1 < n ? getX(batch, i1) : negativeInf;

         // Denotes which direction indices are in (ascending or descending).
         bool reverse = imod(elemIdx, 2 * dir) >= dir;
         bool isGreater = x0 > x1 || (x0 == x1 && i1 > i0);
         if (reverse == isGreater) { // Elements in opposite order of direction
           int iTemp = i0;
           i0 = i1;
           i1 = iTemp;
         }
         if (isFirstInPair) {
            setOutput(float(i0));
         } else {
            setOutput(float(i1));
         }
       }
     `}},Tm=class{constructor(t){this.variableNames=["x","indices"],this.customUniforms=[{name:"n",type:"int"},{name:"firstPass",type:"int"},{name:"k",type:"int"}],this.outputShape=t,this.userCode=`
    void main() {
         // Takes max of indices (0, k), (1, k + 1), (2, k + 2) ...
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int elemIdx = coords[1];

         // The output size is half of the previous size.
         // If the previous sequence is | | | | _ _ _ _  | | | |  _ _ _ _ (k=4),
         // we only need to output the indices at positions |, the indices at
         // positions _ can be thrown away, see Figure5(b) After Phase 2
         // (Merge phase) in the Bitonic Top K paper referenced above.
         // For example, the paper shows we only need to output the orange bars.
         // The output sequence should look like this | | | | | | | |.
         // Because the sequence is halved, to map the output index back
         // to the previous sequence to find the corresponding value,
         // we need to double the index. When we double the index,
         // we basically interpolate a position, so 2i looks like
         // | _ | _ | _ | _ | _ | _ | _. We move the | to the first k position
         // of each 2k positions by - elemIdx % k. E.g. for output at
         // index 4,5,6,7, we want to get the corresponding element at
         // original index 8,9,10,11, for output at index 8,9,10,11,
         // we want to get the corresponding element at original index
         // 16,17,18,19, so on and so forth.

         int i = elemIdx < k ? elemIdx : (elemIdx * 2 - imod(elemIdx, k));
         int i0 = firstPass == 1 ? i : int(getIndices(batch, i));
         int i1 = firstPass == 1 ? i + k : int(getIndices(batch, i + k));

         float x0 = getX(batch, i0);
         float x1 = i1 < n ? getX(batch, i1) : x0;

         setOutput(x0 >= x1 ? float(i0) : float(i1));
       }
     `}};function is(r,t){t!==null&&r.disposeIntermediateTensorInfo(t)}function ck(r){let t=1;for(;t<r;)t*=2;return t}function Xz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{k:s,sorted:a}=o,i=F().getNumber("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD"),c=F().getNumber("TOPK_K_CPU_HANDOFF_THRESHOLD"),p=n.shape,l=p[p.length-1];if(e.shouldExecuteOnCPU([n])||l<i||s>c){let _=e.readSync(n.dataId),[O,L]=IN(_,p,n.dtype,s,a);return[e.makeTensorInfo(O.shape,O.dtype,O.values),e.makeTensorInfo(L.shape,L.dtype,L.values)]}if(s===0)return p[p.length-1]=0,[e.makeTensorInfo(p,n.dtype,[]),e.makeTensorInfo(p,"int32",[])];if(l===1)return[n,jr({attrs:{shape:p,dtype:"int32",value:0},backend:e})];let u=e.texData.get(n.dataId),m=u!==null&&u.isPacked,f=m?e.unpackTensor(n):n,h=y.sizeFromShape(p)/l,g=K({inputs:{x:f},attrs:{shape:[h,l]},backend:e});m&&is(e,f);let x=ck(s),b=ck(l),S=null,N=()=>S===null?[g,g]:[g,S],k=(_,O,L)=>{let B=N(),M=new Cm(L),G=[[l],[S===null?1:0],[Number.NEGATIVE_INFINITY],[_],[O]],U=S;S=e.runWebGLProgram(M,B,"int32",G),is(e,U)};for(let _=1;_<x;_*=2){let O=_*2;for(let L=_;L>=1;L/=2)k(O,L,[h,b])}for(let _=b;_>x;_/=2){let O=N(),L=new Tm([h,_/2]),M=[[l],[S===null?1:0],[x]],V=S;S=e.runWebGLProgram(L,O,"int32",M),is(e,V);let G=x/2,U=G*2;for(let z=G;z>=1;z/=2)k(U,z,S.shape)}let $=S;S=hr({inputs:{x:S},backend:e,attrs:{begin:0,size:[h,s]}}),is(e,$);let R=yh({inputs:{x:g,indices:S},backend:e,attrs:{axis:1,batchDims:1}});is(e,g);let A=p.slice(0,-1);A.push(s),$=S,S=K({inputs:{x:S},attrs:{shape:A},backend:e}),is(e,$);let D=R;return R=K({inputs:{x:R},attrs:{shape:A},backend:e}),is(e,D),[R,S]}var pk={kernelName:Pa,backendName:"webgl",kernelFunc:Xz};var Sm=class{constructor(t,e,o,n,s,a){this.variableNames=["Image","Transforms"],this.outputShape=a;let i=o==="nearest"?1:2,c;switch(n){case"constant":c=1;break;case"reflect":c=2;break;case"wrap":c=3;break;case"nearest":c=4;break;default:c=1;break}this.userCode=`
            float mapCoord(float outCoord, float len) {
              float inCoord = outCoord;
              if(${c} == 2) {
                if (inCoord < 0.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz2 = 2.0 * len;
                    if (inCoord < sz2) {
                      inCoord = sz2 * float(int(float(-inCoord / sz2))) +
                      inCoord;
                    }
                    inCoord = inCoord < -len ? inCoord + sz2 : -inCoord - 1.0;
                  }
                } else if (inCoord > len - 1.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz2 = 2.0 * len;
                    inCoord -= sz2 * float(int(float(inCoord / sz2)));
                    if (inCoord >= len) {
                      inCoord = sz2 - inCoord - 1.0;
                    }
                  }
                }
                return clamp(inCoord, 0.0, len - 1.0);
              } else if (${c} == 3) {
                if (inCoord < 0.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz = len - 1.0;
                    inCoord += len * (float(int(float(-inCoord / sz))) + 1.0);
                  }
                } else if (inCoord > len - 1.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz = len - 1.0;
                    inCoord -= len * float(int(float(inCoord / sz)));
                  }
                }
                return clamp(inCoord, 0.0, len - 1.0);
              } else if (${c} == 4) {
                return clamp(outCoord, 0.0, len - 1.0);
              } else {
                return outCoord;
              }
            }

            float readWithFillValue(int batch, int coordY, int coordX,
              int channel) {
              float outputValue;
              if (0 <= coordY && coordY < ${t} && 0 <= coordX && coordX < ${e}) {
                  outputValue = getImage(batch, coordY, coordX, channel);
              } else {
                outputValue = float(${s});
              }
              return outputValue;
            }

            void main() {
              ivec4 coords = getOutputCoords();
              float outputValue;
              int batch = coords[0];
              int x = coords[2];
              int y = coords[1];
              int channel = coords[3];
              float xf = float(x);
              float yf = float(y);
              float a1 = getTransforms(batch, 0);
              float a2 = getTransforms(batch, 1);
              float a3 = getTransforms(batch, 2);
              float b1 = getTransforms(batch, 3);
              float b2 = getTransforms(batch, 4);
              float b3 = getTransforms(batch, 5);
              float c1 = getTransforms(batch, 6);
              float c2 = getTransforms(batch, 7);
              float projection = c1 * xf + c2 * yf + 1.0;
              if (projection == 0.0) {
                outputValue = float(${s});
              } else {
                float inX = (a1 * xf + a2 * yf + a3) / projection;
                float inY = (b1 * xf + b2 * yf + b3) / projection;
                float mapX = mapCoord(inX, float(${e}));
                float mapY = mapCoord(inY, float(${t}));

                if (${i} == 1) {
                  int coordY = int(round(mapY));
                  int coordX = int(round(mapX));
                  outputValue = readWithFillValue(batch, coordY, coordX,
                    channel);
                } else {
                  float yFloor = floor(mapY);
                  float xFloor = floor(mapX);
                  float yCeil = yFloor + 1.0;
                  float xCeil = xFloor + 1.0;
                  float valueYFloor = (xCeil - mapX) *
                  readWithFillValue(batch, int(yFloor), int(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, int(yFloor), int(xCeil), channel);
                  float valueYCeil = (xCeil - mapX) *
                  readWithFillValue(batch, int(yCeil), int(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, int(yCeil), int(xCeil), channel);
                  outputValue = (yCeil - mapY) * valueYFloor +
                  (mapY - yFloor) * valueYCeil;
                }
              }
              setOutput(outputValue);
            }
        `}};function jz(r){let{inputs:t,backend:e,attrs:o}=r,{image:n,transforms:s}=t,{interpolation:a,fillMode:i,fillValue:c,outputShape:p}=o,[l,u,m,f]=n.shape,[d,h]=p??[u,m],g=[l,d,h,f],x=new Sm(u,m,a,i,c,g);return e.runWebGLProgram(x,[n,s],"float32")}var lk={kernelName:La,backendName:"webgl",kernelFunc:jz};function Yz(r){let{inputs:t,attrs:e,backend:o}=r,{axis:n}=e,{x:s}=t;Ar(s,"unique"),console.warn("WARNING: ","UI might be locked temporarily as data is being downloaded");let a=o.readSync(s.dataId),{outputValues:i,outputShape:c,indices:p}=vN(a,n,s.shape,s.dtype);return[o.makeTensorInfo(c,s.dtype,i),o.makeTensorInfo([p.length],"int32",p)]}var uk={kernelName:Ba,backendName:"webgl",kernelFunc:Yz};function Zz(r){let{inputs:t,backend:e,attrs:o}=r,{value:n}=t,{axis:s}=o;s<0&&(s+=n.shape.length);let a=n,i=a.shape.length,c=n.shape[s],p=new Array(i-1),l=0;for(let h=0;h<i;h++)h!==s&&(p[l++]=a.shape[h]);let u=[],m=new Array(i).fill(0),f=a.shape.slice();f[s]=1;let d=new Array(c);for(let h=0;h<d.length;h++){m[s]=h;let g=hr({inputs:{x:a},backend:e,attrs:{begin:m,size:f}}),x=K({inputs:{x:g},backend:e,attrs:{shape:p}});d[h]=x,u.push(g)}return u.forEach(h=>e.disposeIntermediateTensorInfo(h)),d}var mk={kernelName:Va,backendName:"webgl",kernelFunc:Zz};var wm=class{constructor(t,e){this.variableNames=["x","segmentIds"];let o=t.windowSize,n=t.batchSize,s=t.inSize,a=t.numSegments,i=a*Math.ceil(s/o);this.outputShape=[n,i];let c="0.0",p="sumValue",l=Math.floor(o/4)*4,u=o%4,m=`
        sumValue += dot(values, segFilter);
    `,f="";s%o>0&&(f=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return initializationValue;
        }
      `);let d="";s%o>0&&(d=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return -1.0;
        }
      `),this.userCode=`
      const float initializationValue = ${c};

      float getValue(int batch, int inIdx) {
        ${f}
        return getX(batch, inIdx);
      }

      float getSegmentIdAtIndex(int inIdx) {
        ${d}
        return getSegmentIds(inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = int(floor(float(outIdx) / float(
          ${a})) * float(${o}));
        int currentSeg = int(mod(float(outIdx), float(${a})));

        float sumValue = 0.0;

        for (int i = 0; i < ${l}; i += 4) {
          int inIdx = inOffset + i;
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 2)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 3)) == currentSeg ? 1 : 0
          );

          ${m}
        }

        int inIdx = inOffset + ${l};
        if (${u===1}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            initializationValue,
            initializationValue,
            initializationValue
          );

          int inIdxSeg = int(getSegmentIdAtIndex(inIdx));

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            0,
            0,
            0
          );

          ${m}
        } else if (${u===2}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            initializationValue,
            initializationValue
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
              0,
              0
          );

          ${m}
        } else if (${u===3}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            initializationValue
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 2)) == currentSeg ? 1 : 0,
            0
          );

          ${m}
        }
        setOutput(${p});
      }
    `}};function Qz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,segmentIds:s}=t,{numSegments:a}=o,i=n.shape.length,c=[],p=0,l=I.getAxesPermutation([p],i),u=n;l!=null&&(u=_t({inputs:{x:n},backend:e,attrs:{perm:l}}),c.push(u),p=I.getInnerMostAxes(1,i)[0]);let m=I.segment_util.computeOutShape(u.shape,p,a),f=y.sizeFromShape([u.shape[p]]),d=K({inputs:{x:u},backend:e,attrs:{shape:[-1,f]}});c.push(d);let h=Rn(n.dtype),g=(N,k,$,R,A)=>{let D=N.shape[0],_=N.shape[1],O=I.segment_util.segOpComputeOptimalWindowSize(_,A),L={windowSize:O,inSize:_,batchSize:D,numSegments:A},B=new wm(L,k),M=e.compileAndRun(B,[N,$],R);if(c.push(M),M.shape[1]===A)return M;let V=Nh({backend:e,attrs:{start:0,stop:A,step:1,dtype:"float32"}}),G=Ih({inputs:{x:V},backend:e,attrs:{reps:[_/O]}});return c.push(V),c.push(G),g(M,k,G,R,A)},x=g(d,"unsortedSegmentSum",s,h,a),b=K({inputs:{x},backend:e,attrs:{shape:m}}),S=b;if(l!=null){c.push(b);let N=I.getUndoAxesPermutation(l);S=_t({inputs:{x:S},backend:e,attrs:{perm:N}})}return c.forEach(N=>e.disposeIntermediateTensorInfo(N)),S}var fk={kernelName:Ma,backendName:"webgl",kernelFunc:Qz};var Jz=[JN,e1,r1,o1,s1,a1,i1,c1,u1,m1,f1,d1,h1,g1,x1,y1,b1,C1,T1,S1,w1,I1,v1,k1,A1,D1,_1,GN,P1,B1,V1,M1,z1,W1,G1,U1,H1,K1,q1,Y1,Z1,Q1,J1,tI,eI,rI,oI,nI,sI,aI,iI,cI,pI,lI,uI,fI,dI,hI,gI,yI,bI,CI,TI,SI,wI,NI,II,vI,WN,kI,L1,EI,$I,RI,UN,AI,FI,DI,_I,OI,PI,LI,BI,VI,MI,WI,GI,UI,HI,KI,qI,jI,ZI,QI,JI,tv,ev,av,qN,iv,cv,pv,lv,E1,uv,dv,hv,gv,xv,HN,yv,bv,Cv,Tv,$1,rv,Sv,wv,Nv,jN,Iv,vv,kv,Ev,$v,Rv,Av,Fv,Dv,_v,Ov,Pv,Lv,Bv,Vv,Mv,N1,sv,zv,Wv,Gv,Uv,Hv,Kv,qv,Xv,Yv,Zv,Jv,tk,ek,rk,ok,nk,nv,ZN,sk,ak,ik,pk,lk,QN,uk,mk,fk,mv];for(let r of Jz)Qc(r);var t4=F();t4.registerFlag("KEEP_INTERMEDIATE_TENSORS",()=>!1,r=>{r&&console.warn("Keep intermediate tensors is ON. This will print the values of all intermediate tensors during model inference. Not all models support this mode. For details, check e2e/benchmarks/ model_config.js. This significantly impacts performance.")});var Ge;(function(r){r[r.DT_INVALID=0]="DT_INVALID",r[r.DT_FLOAT=1]="DT_FLOAT",r[r.DT_DOUBLE=2]="DT_DOUBLE",r[r.DT_INT32=3]="DT_INT32",r[r.DT_UINT8=4]="DT_UINT8",r[r.DT_INT16=5]="DT_INT16",r[r.DT_INT8=6]="DT_INT8",r[r.DT_STRING=7]="DT_STRING",r[r.DT_COMPLEX64=8]="DT_COMPLEX64",r[r.DT_INT64=9]="DT_INT64",r[r.DT_BOOL=10]="DT_BOOL",r[r.DT_QINT8=11]="DT_QINT8",r[r.DT_QUINT8=12]="DT_QUINT8",r[r.DT_QINT32=13]="DT_QINT32",r[r.DT_BFLOAT16=14]="DT_BFLOAT16",r[r.DT_QINT16=15]="DT_QINT16",r[r.DT_QUINT16=16]="DT_QUINT16",r[r.DT_UINT16=17]="DT_UINT16",r[r.DT_COMPLEX128=18]="DT_COMPLEX128",r[r.DT_HALF=19]="DT_HALF",r[r.DT_RESOURCE=20]="DT_RESOURCE",r[r.DT_VARIANT=21]="DT_VARIANT",r[r.DT_UINT32=22]="DT_UINT32",r[r.DT_UINT64=23]="DT_UINT64",r[r.DT_FLOAT_REF=101]="DT_FLOAT_REF",r[r.DT_DOUBLE_REF=102]="DT_DOUBLE_REF",r[r.DT_INT32_REF=103]="DT_INT32_REF",r[r.DT_UINT8_REF=104]="DT_UINT8_REF",r[r.DT_INT16_REF=105]="DT_INT16_REF",r[r.DT_INT8_REF=106]="DT_INT8_REF",r[r.DT_STRING_REF=107]="DT_STRING_REF",r[r.DT_COMPLEX64_REF=108]="DT_COMPLEX64_REF",r[r.DT_INT64_REF=109]="DT_INT64_REF",r[r.DT_BOOL_REF=110]="DT_BOOL_REF",r[r.DT_QINT8_REF=111]="DT_QINT8_REF",r[r.DT_QUINT8_REF=112]="DT_QUINT8_REF",r[r.DT_QINT32_REF=113]="DT_QINT32_REF",r[r.DT_BFLOAT16_REF=114]="DT_BFLOAT16_REF",r[r.DT_QINT16_REF=115]="DT_QINT16_REF",r[r.DT_QUINT16_REF=116]="DT_QUINT16_REF",r[r.DT_UINT16_REF=117]="DT_UINT16_REF",r[r.DT_COMPLEX128_REF=118]="DT_COMPLEX128_REF",r[r.DT_HALF_REF=119]="DT_HALF_REF",r[r.DT_RESOURCE_REF=120]="DT_RESOURCE_REF",r[r.DT_VARIANT_REF=121]="DT_VARIANT_REF",r[r.DT_UINT32_REF=122]="DT_UINT32_REF",r[r.DT_UINT64_REF=123]="DT_UINT64_REF"})(Ge||(Ge={}));var dk;(function(r){let t;(function(e){e[e.LEGACY=0]="LEGACY",e[e.V1=1]="V1",e[e.V2=2]="V2"})(t=r.CheckpointFormatVersion||(r.CheckpointFormatVersion={}))})(dk||(dk={}));var r4={};function Nm(r){return r4[r]}function C(r,t,e,o,n){let s=t.inputParams[r];if(s&&s.inputIndexStart!==void 0){let i=s.inputIndexStart,c=s.inputIndexEnd===0?void 0:s.inputIndexEnd===void 0?i+1:s.inputIndexEnd;if(s.type==="tensor")return re(t.inputNames[s.inputIndexStart],e,o,n);if(s.type==="tensors")return t.inputNames.slice(i,c).map(m=>re(m,e,o,n));let p=re(t.inputNames.slice(i)[0],e,o,n),l=p.dataSync();return s.type==="number"?l[0]:y.toNestedArray(p.shape,l)}let a=t.attrParams[r];return a&&a.value}function re(r,t,e,o){let[n,s]=Se(r);if(o!=null){let i=o.getHashTableHandleByName(n);if(i!=null)return i}let a=e.currentContextIds.find(i=>!!t[Im(n,i)]);return a!==void 0?t[Im(n,a)][s]:void 0}function hk(r,t,e){return t[Im(r,e.currentContextId)]}function sr(r,t){let[e,o,n]=Se(r);return[Im(e,t&&t.currentContextId),o,n]}function Im(r,t){return t?`${r}-${t}`:r}function Se(r){let t=r.split(":");if(t.length===1)return[r,0,void 0];let e=t[0],o=t.length===3?t[1]:void 0,n=Number(t[t.length-1]);return[e,n,o]}function Dc(r,t,e){let o=C("pad",r,t,e);if(o==="explicit"){o=C("explicitPaddings",r,t,e);let n=[[0,0],[0,0],[0,0],[0,0]];for(let s=0;s<4;s++)n[s][0]=o[s*2],n[s][1]=o[s*2+1];return n}return o}function gr(r){return r.kept?r:Ae(r)}var vh={};At(vh,{json:()=>o4});var o4=[{tfOpName:"Add",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AddV2",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AddN",category:"arithmetic",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}]},{tfOpName:"BiasAdd",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"Sub",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"RealDiv",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Div",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"DivNoNan",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"FloorDiv",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Mul",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Maximum",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Minimum",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Pow",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SquaredDifference",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Mod",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"FloorMod",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var kh={};At(kh,{json:()=>n4});var n4=[{tfOpName:"Abs",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Acos",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Asin",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atan2",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Ceil",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ClipByValue",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"clipValueMin",type:"number"},{start:2,name:"clipValueMax",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Complex",category:"basic_math",inputs:[{start:0,name:"real",type:"tensor"},{start:1,name:"imag",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ComplexAbs",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cos",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cosh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Elu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Exp",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Floor",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Log",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Imag",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"Tout",name:"outputType",type:"dtype",notSupported:!0}]},{tfOpName:"Neg",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Real",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"Tout",name:"outputType",type:"dtype",notSupported:!0}]},{tfOpName:"Prelu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"alpha",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Relu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Relu6",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Selu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sigmoid",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sin",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sinh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sqrt",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Rsqrt",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Square",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Tan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Tanh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sign",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Round",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Expm1",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Log1p",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Reciprocal",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Softplus",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Asinh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Acosh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atanh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Erf",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Prod",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axes",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool",notSupported:!0},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LeakyRelu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"alpha",name:"alpha",type:"number",defaultValue:.2},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"IsNan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Eh={};At(Eh,{json:()=>s4});var s4=[{tfOpName:"EmptyTensorList",category:"control",inputs:[{start:0,name:"elementShape",type:"shape"},{start:1,name:"maxNumElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"LoopCond",category:"control",inputs:[{start:0,name:"pred",type:"tensor"}]},{tfOpName:"Switch",category:"control",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"pred",type:"tensor"}]},{tfOpName:"Merge",category:"control",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}]},{tfOpName:"Enter",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"frame_name",name:"frameName",type:"string"},{tfName:"is_constant",name:"isConstant",type:"bool"}]},{tfOpName:"Exit",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"NextIteration",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayV3",category:"control",inputs:[{start:0,name:"size",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"dynamic_size",name:"dynamicSize",type:"bool"},{tfName:"clear_after_read",name:"clearAfterRead",type:"bool"},{tfName:"identical_element_shapes",name:"identicalElementShapes",type:"bool"},{tfName:"tensor_array_name",name:"name",type:"string"}]},{tfOpName:"TensorArrayWriteV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"tensor",type:"tensor"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayReadV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayGatherV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape",name:"elementShape",type:"shape"}]},{tfOpName:"TensorArrayScatterV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"tensor",type:"tensor"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"TensorArrayConcatV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape_except0",name:"elementShapeExcept0",type:"shape",notSupported:!0}]},{tfOpName:"TensorArraySplitV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"tensor",type:"tensor"},{start:2,name:"lengths",type:"number[]"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"TensorArraySizeV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"flowIn",type:"number"}]},{tfOpName:"TensorArrayCloseV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"}]},{tfOpName:"StatelessIf",category:"control",inputs:[{start:0,name:"cond",type:"tensor"},{start:1,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"then_branch",name:"thenBranch",type:"func"},{tfName:"else_branch",name:"elseBranch",type:"func"}]},{tfOpName:"If",category:"control",inputs:[{start:0,name:"cond",type:"tensor"},{start:1,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"then_branch",name:"thenBranch",type:"func"},{tfName:"else_branch",name:"elseBranch",type:"func"}]},{tfOpName:"StatelessWhile",category:"control",inputs:[{start:0,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"cond",name:"cond",type:"func"},{tfName:"body",name:"body",type:"func"}]},{tfOpName:"While",category:"control",inputs:[{start:0,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"cond",name:"cond",type:"func"},{tfName:"body",name:"body",type:"func"}]},{tfOpName:"TensorListScatter",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListScatterV2",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"},{start:3,name:"numElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListGather",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListGetItem",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListSetItem",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"tensor",type:"tensor"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListReserve",category:"control",inputs:[{start:0,name:"elementShape",type:"shape"},{start:1,name:"numElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListFromTensor",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListStack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"},{tfName:"num_elements",name:"numElements",type:"dtype"}]},{tfOpName:"TensorListSplit",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"elementShape",type:"shape"},{start:2,name:"lengths",type:"number[]"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListConcat",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}],attrs:[{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListConcatV2",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}],attrs:[{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListPopBack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListPushBack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"tensor",type:"tensor"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListLength",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}]},{tfOpName:"TensorListResize",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"size",type:"number"}]}];var $h={};At($h,{json:()=>a4});var a4=[{tfOpName:"AvgPool",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPool",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[],notSupported:!0},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPoolWithArgmax",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"include_batch_in_index",name:"includeBatchInIndex",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AvgPool3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPool3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Conv1D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"stride",name:"stride",type:"number"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NWC"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"dilation",name:"dilation",type:"number",defaultValue:1}]},{tfOpName:"Conv2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"useCudnnOnGpu",name:"useCudnnOnGpu",type:"bool"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"_FusedConv2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"use_cudnn_on_gpu",name:"useCudnnOnGpu",type:"bool",defaultValue:!0},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]",defaultValue:[1,1,1,1]},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:1e-4},{tfName:"leakyrelu_alpha",name:"leakyreluAlpha",type:"number",defaultValue:.2}]},{tfOpName:"Conv2DBackpropInput",category:"convolution",inputs:[{start:2,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:0,name:"outputShape",type:"number[]"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]",notSupported:!0}]},{tfOpName:"DepthwiseConv2d",category:"convolution",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"DepthwiseConv2dNative",category:"convolution",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"FusedDepthwiseConv2dNative",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]",defaultValue:[1,1,1,1]},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]}]},{tfOpName:"Conv3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"Dilation2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"rates",name:"dilations",type:"number[]"},{tfName:"padding",name:"pad",type:"string"}]}];var Rh={};At(Rh,{json:()=>i4});var i4=[{tfOpName:"Fill",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"},{start:1,name:"value",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"LinSpace",category:"creation",inputs:[{start:0,name:"start",type:"number"},{start:1,name:"stop",type:"number"},{start:2,name:"num",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"OneHot",category:"creation",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"depth",type:"number"},{start:2,name:"onValue",type:"number",defaultValue:1},{start:3,name:"offValue",type:"number",defaultValue:0}],attrs:[{tfName:"axis",name:"axis",type:"number",notSupported:!0},{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"Ones",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"OnesLike",category:"creation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"RandomStandardNormal",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"RandomUniform",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"minval",name:"minval",type:"number",defaultValue:0},{tfName:"maxval",name:"maxval",type:"number",defaultValue:1},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"Range",category:"creation",inputs:[{start:0,name:"start",type:"number"},{start:1,name:"stop",type:"number"},{start:2,name:"step",type:"number",defaultValue:0}],attrs:[{tfName:"Tidx",name:"dtype",type:"dtype"}]},{tfOpName:"TruncatedNormal",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"means",name:"mean",type:"number",defaultValue:0},{tfName:"stddev",name:"stdDev",type:"number",defaultValue:1},{tfName:"seed",name:"seed",type:"number"},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"Zeros",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"ZerosLike",category:"creation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"Multinomial",category:"creation",inputs:[{start:0,name:"logits",type:"tensor"},{start:1,name:"numSamples",type:"number"}],attrs:[{tfName:"seed",name:"seed",type:"number"},{tfName:"seed2",name:"seed2",type:"number"},{tfName:"T",name:"dtype",type:"dtype"},{tfName:"output_dtype",name:"output_dtype",type:"dtype"}]}];var Ah={};At(Ah,{json:()=>c4});var c4=[{tfOpName:"NonMaxSuppressionV2",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"}]},{tfOpName:"NonMaxSuppressionV3",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"}]},{tfOpName:"NonMaxSuppressionV4",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"T_threshold",name:"threshold",type:"dtype",notSupported:!0},{tfName:"pad_to_max_output_size",name:"padToMaxOutputSize",type:"bool"}]},{tfOpName:"NonMaxSuppressionV5",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"},{start:5,name:"softNmsSigma",type:"number"}]},{tfOpName:"Where",category:"dynamic",inputs:[{start:0,name:"condition",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ListDiff",category:"dynamic",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Fh={};At(Fh,{json:()=>p4});var p4=[{tfOpName:"LowerBound",category:"evaluation",inputs:[{start:0,name:"sortedSequence",type:"tensor"},{start:1,name:"values",type:"tensor"}]},{tfOpName:"TopKV2",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"k",type:"number"}],attrs:[{tfName:"sorted",name:"sorted",type:"bool"}]},{tfOpName:"UpperBound",category:"evaluation",inputs:[{start:0,name:"sortedSequence",type:"tensor"},{start:1,name:"values",type:"tensor"}]},{tfOpName:"Unique",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"UniqueV2",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]}];var Dh={};At(Dh,{json:()=>l4});var l4=[{tfOpName:"PlaceholderWithDefault",category:"graph",inputs:[{start:0,name:"default",type:"tensor"}],attrs:[{tfName:"shape",name:"shape",type:"shape"},{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"Placeholder",category:"graph",attrs:[{tfName:"shape",name:"shape",type:"shape"},{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"Const",category:"graph"},{tfOpName:"Identity",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"IdentityN",category:"graph",inputs:[{start:0,end:0,name:"x",type:"tensors"}]},{tfOpName:"Snapshot",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Rank",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Size",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Shape",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"ShapeN",category:"graph",inputs:[{start:0,end:0,name:"x",type:"tensors"}]},{tfOpName:"Print",category:"graph",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"data",type:"tensors"}],attrs:[{tfName:"message",name:"message",type:"string"},{tfName:"first_n",name:"firstN",type:"number",notSupported:!0},{tfName:"summarize",name:"summarize",type:"number",defaultValue:3}]},{tfOpName:"NoOp",category:"graph",inputs:[]},{tfOpName:"StopGradient",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"FakeQuantWithMinMaxVars",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"min",name:"min",type:"number"},{tfName:"max",name:"max",type:"number"}]}];var _h={};At(_h,{json:()=>u4});var u4=[{tfOpName:"HashTable",category:"hash_table",inputs:[],attrs:[{tfName:"shared_name",name:"sharedName",type:"string"},{tfName:"use_node_name_sharing",name:"useNodeNameSharing",type:"bool"},{tfName:"key_dtype",name:"keyDType",type:"dtype"},{tfName:"value_dtype",name:"valueDType",type:"dtype"}]},{tfOpName:"HashTableV2",category:"hash_table",inputs:[],attrs:[{tfName:"shared_name",name:"sharedName",type:"string"},{tfName:"use_node_name_sharing",name:"useNodeNameSharing",type:"bool"},{tfName:"key_dtype",name:"keyDType",type:"dtype"},{tfName:"value_dtype",name:"valueDType",type:"dtype"}]},{tfOpName:"LookupTableImport",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableImportV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableFind",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableFindV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableSize",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"}]},{tfOpName:"LookupTableSizeV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"}]}];var Oh={};At(Oh,{json:()=>m4});var m4=[{tfOpName:"ResizeBilinear",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"size",type:"number[]"}],attrs:[{tfName:"align_corners",name:"alignCorners",type:"bool"},{tfName:"half_pixel_centers",name:"halfPixelCenters",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ResizeNearestNeighbor",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"size",type:"number[]"}],attrs:[{tfName:"align_corners",name:"alignCorners",type:"bool"},{tfName:"half_pixel_centers",name:"halfPixelCenters",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"CropAndResize",category:"image",inputs:[{start:0,name:"image",type:"tensor"},{start:1,name:"boxes",type:"tensor"},{start:2,name:"boxInd",type:"tensor"},{start:3,name:"cropSize",type:"number[]"}],attrs:[{tfName:"method",name:"method",type:"string"},{tfName:"extrapolation_value",name:"extrapolationValue",type:"number"}]},{tfOpName:"ImageProjectiveTransformV3",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"transforms",type:"tensor"},{start:2,name:"outputShape",type:"number[]"},{start:3,name:"fillValue",type:"number"}],attrs:[{tfName:"interpolation",name:"interpolation",type:"string"},{tfName:"fill_mode",name:"fillMode",type:"string"}]}];var Ph={};At(Ph,{json:()=>f4});var f4=[{tfOpName:"Equal",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"NotEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Greater",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"GreaterEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Less",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LessEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalAnd",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalNot",category:"logical",inputs:[{start:0,name:"a",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalOr",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Select",category:"logical",inputs:[{start:0,name:"condition",type:"tensor"},{start:1,name:"a",type:"tensor"},{start:2,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SelectV2",category:"logical",inputs:[{start:0,name:"condition",type:"tensor"},{start:1,name:"a",type:"tensor"},{start:2,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Lh={};At(Lh,{json:()=>d4});var d4=[{tfOpName:"_FusedMatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:1e-4},{tfName:"transpose_a",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"transpose_b",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"leakyrelu_alpha",name:"leakyreluAlpha",type:"number",defaultValue:.2},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"transpose_a",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"transpose_b",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BatchMatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"adj_x",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"adj_y",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BatchMatMulV2",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"adj_x",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"adj_y",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Transpose",category:"matrices",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"perm",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Einsum",category:"matrices",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}],attrs:[{tfName:"equation",name:"equation",type:"string"},{tfName:"N",name:"n",type:"number",defaultValue:2},{tfName:"T",name:"dtype",type:"dtype"}]}];var Bh={};At(Bh,{json:()=>h4});var h4=[{tfOpName:"EuclideanNorm",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool",defaultValue:!1}]},{tfOpName:"FusedBatchNorm",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"FusedBatchNormV2",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"FusedBatchNormV3",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"LRN",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"depth_radius",name:"radius",type:"number",defaultValue:5},{tfName:"bias",name:"bias",type:"number",defaultValue:1},{tfName:"alpha",name:"alpha",type:"number",defaultValue:1},{tfName:"beta",name:"beta",type:"number",defaultValue:.5}]},{tfOpName:"Softmax",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"LogSoftmax",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"SparseToDense",category:"normalization",inputs:[{start:0,name:"sparseIndices",type:"tensor"},{start:1,name:"outputShape",type:"number[]"},{start:2,name:"sparseValues",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",defaultValue:!0,notSupported:!0}]}];var Vh={};At(Vh,{json:()=>g4});var g4=[{tfOpName:"Bincount",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"size",type:"number"},{start:2,name:"weights",type:"tensor"}]},{tfOpName:"DenseBincount",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"size",type:"number"},{start:2,name:"weights",type:"tensor"}],attrs:[{tfName:"binary_output",name:"binaryOutput",type:"bool"}]},{tfOpName:"Max",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Mean",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Min",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Sum",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"All",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Any",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"ArgMax",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"ArgMin",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"Prod",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Cumprod",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}],attrs:[{tfName:"exclusive",name:"exclusive",type:"bool"},{tfName:"reverse",name:"reverse",type:"bool"}]},{tfOpName:"Cumsum",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}],attrs:[{tfName:"exclusive",name:"exclusive",type:"bool"},{tfName:"reverse",name:"reverse",type:"bool"}]}];var Mh={};At(Mh,{json:()=>x4});var x4=[{tfOpName:"ConcatV2",category:"slice_join",inputs:[{start:0,end:-1,name:"tensors",type:"tensors"},{start:-1,name:"axis",type:"number"}],attrs:[{tfName:"N",name:"n",type:"number",defaultValue:2}]},{tfOpName:"Concat",category:"slice_join",inputs:[{start:1,end:0,name:"tensors",type:"tensors"},{start:0,name:"axis",type:"number"}],attrs:[{tfName:"N",name:"n",type:"number",defaultValue:2}]},{tfOpName:"GatherV2",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"axis",type:"number",defaultValue:0}],attrs:[{tfName:"batch_dims",name:"batchDims",type:"number",defaultValue:0}]},{tfOpName:"Gather",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",notSupported:!0}]},{tfOpName:"Reverse",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"dims",type:"bool[]"}]},{tfOpName:"ReverseV2",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}]},{tfOpName:"Slice",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"begin",type:"number[]"},{start:2,name:"size",type:"number[]"}]},{tfOpName:"StridedSlice",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"begin",type:"number[]"},{start:2,name:"end",type:"number[]"},{start:3,name:"strides",type:"number[]"}],attrs:[{tfName:"begin_mask",name:"beginMask",type:"number",defaultValue:0},{tfName:"end_mask",name:"endMask",type:"number",defaultValue:0},{tfName:"new_axis_mask",name:"newAxisMask",type:"number",defaultValue:0},{tfName:"ellipsis_mask",name:"ellipsisMask",type:"number",defaultValue:0},{tfName:"shrink_axis_mask",name:"shrinkAxisMask",type:"number",defaultValue:0}]},{tfOpName:"Pack",category:"slice_join",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}],attrs:[{tfName:"axis",name:"axis",type:"number",defaultValue:0}]},{tfOpName:"Unpack",category:"slice_join",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"axis",name:"axis",type:"number",defaultValue:0},{tfName:"num",name:"num",type:"number",defaultValue:0,notSupported:!0}]},{tfOpName:"Tile",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"reps",type:"number[]"}]},{tfOpName:"Split",category:"slice_join",inputs:[{start:0,name:"axis",type:"number",defaultValue:0},{start:1,name:"x",type:"tensor"}],attrs:[{tfName:"num_split",name:"numOrSizeSplits",type:"number",defaultValue:1}]},{tfOpName:"SplitV",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"numOrSizeSplits",type:"number[]"},{start:2,name:"axis",type:"number",defaultValue:0}]},{tfOpName:"ScatterNd",category:"slice_join",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"values",type:"tensor"},{start:2,name:"shape",type:"number[]"}]},{tfOpName:"GatherNd",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"}]},{tfOpName:"SparseToDense",category:"slice_join",inputs:[{start:0,name:"sparseIndices",type:"tensor"},{start:1,name:"outputShape",type:"number[]"},{start:2,name:"sparseValues",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",defaultValue:!1,notSupported:!0}]}];var zh={};At(zh,{json:()=>y4});var y4=[{tfOpName:"SparseFillEmptyRows",category:"sparse",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"values",type:"tensor"},{start:2,name:"denseShape",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}]},{tfOpName:"SparseReshape",category:"sparse",inputs:[{start:0,name:"inputIndices",type:"tensor"},{start:1,name:"inputShape",type:"tensor"},{start:2,name:"newShape",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SparseSegmentMean",category:"sparse",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"segmentIds",type:"tensor"}]},{tfOpName:"SparseSegmentSum",category:"sparse",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"segmentIds",type:"tensor"}]}];var Wh={};At(Wh,{json:()=>b4});var b4=[{tfOpName:"FFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"IFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"RFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"fft_length",type:"number",notSupported:!0}]},{tfOpName:"IRFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"fft_length",type:"number",notSupported:!0}]}];var Gh={};At(Gh,{json:()=>C4});var C4=[{tfOpName:"StringNGrams",category:"string",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"dataSplits",type:"tensor"}],attrs:[{tfName:"separator",name:"separator",type:"string"},{tfName:"ngram_widths",name:"nGramWidths",type:"number[]"},{tfName:"left_pad",name:"leftPad",type:"string"},{tfName:"right_pad",name:"rightPad",type:"string"},{tfName:"pad_width",name:"padWidth",type:"number"},{tfName:"preserve_short_sequences",name:"preserveShortSequences",type:"bool"}],outputs:["ngrams","ngrams_splits"]},{tfOpName:"StringSplit",category:"string",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"delimiter",type:"tensor"}],attrs:[{tfName:"skip_empty",name:"skipEmpty",type:"bool"}],outputs:["indices","values","shape"]},{tfOpName:"StringToHashBucketFast",category:"string",inputs:[{start:0,name:"input",type:"tensor"}],attrs:[{tfName:"num_buckets",name:"numBuckets",type:"number"}]}];var Uh={};At(Uh,{json:()=>T4});var T4=[{tfOpName:"Cast",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"SrcT",name:"sdtype",type:"dtype",notSupported:!0},{tfName:"DstT",name:"dtype",type:"dtype"}]},{tfOpName:"ExpandDims",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"MirrorPad",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"}],attrs:[{tfName:"mode",name:"mode",type:"string"}]},{tfOpName:"Pad",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"}],attrs:[{tfName:"constant_value",name:"constantValue",type:"number",defaultValue:0}]},{tfOpName:"PadV2",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"},{start:2,name:"constantValue",type:"number",defaultValue:0}]},{tfOpName:"Reshape",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}]},{tfOpName:"Squeeze",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"axis",tfDeprecatedName:"squeeze_dims",name:"axis",type:"number[]"}]},{tfOpName:"SpaceToBatchND",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"blockShape",type:"number[]"},{start:2,name:"paddings",type:"number[]"}]},{tfOpName:"BatchToSpaceND",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"blockShape",type:"number[]"},{start:2,name:"crops",type:"number[]"}]},{tfOpName:"DepthToSpace",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"block_size",name:"blockSize",type:"number"},{tfName:"data_format",name:"dataFormat",type:"string"}]},{tfOpName:"BroadcastTo",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}],attrs:[]},{tfOpName:"BroadcastArgs",category:"transformation",inputs:[{start:0,name:"s0",type:"tensor"},{start:1,name:"s1",type:"tensor"}],attrs:[]}];var _c=class{static get Instance(){return this._instance||(this._instance=new this)}constructor(){let t=[vh,kh,Eh,$h,Rh,Ah,Fh,Dh,_h,Oh,Ph,Lh,Bh,Vh,Mh,zh,Wh,Gh,Uh],e=[].concat(...t.map(o=>o.json));this.opMappers=e.reduce((o,n)=>(o[n.tfOpName]=n,o),{})}transformGraph(t,e={}){let o=t.node,n=[],s=[],a=[],i=o.reduce((h,g)=>(h[g.name]=this.mapNode(g),g.op.startsWith("Placeholder")?n.push(h[g.name]):g.op==="Const"?s.push(h[g.name]):(g.input==null||g.input.length===0)&&a.push(h[g.name]),h),{}),c=[],p=[],l={},u={};e!=null&&(l=this.mapSignatureEntries(e.inputs),u=this.mapSignatureEntries(e.outputs));let m=Object.keys(i);m.forEach(h=>{let g=i[h];g.inputNames.forEach((x,b)=>{let[S,,N]=sr(x),k=i[S];if(k.outputs!=null){let $=k.outputs.indexOf(N);if($!==-1){let R=`${S}:${$}`;g.inputNames[b]=R}}g.inputs.push(k),k.children.push(g)})}),Object.keys(u).length===0?m.forEach(h=>{let g=i[h];g.children.length===0&&p.push(g)}):Object.keys(u).forEach(h=>{let[g]=sr(h),x=i[g];x!=null&&(x.signatureKey=u[h],p.push(x))}),Object.keys(l).length>0?Object.keys(l).forEach(h=>{let[g]=sr(h),x=i[g];x&&(x.signatureKey=l[h],c.push(x))}):c=n;let f={};t.library!=null&&t.library.function!=null&&(f=t.library.function.reduce((h,g)=>(h[g.signature.name]=this.mapFunction(g),h),{}));let d={nodes:i,inputs:c,outputs:p,weights:s,placeholders:n,signature:e,functions:f};return a.length>0&&(d.initNodes=a),d}mapSignatureEntries(t){return Object.keys(t||{}).reduce((e,o)=>(e[t[o].name]=o,e),{})}mapNode(t){let e=Nm(t.op)||this.opMappers[t.op]||{};t.attr==null&&(t.attr={});let o={name:t.name,op:t.op,category:e.category,inputNames:(t.input||[]).map(n=>n.startsWith("^")?n.slice(1):n),inputs:[],children:[],inputParams:{},attrParams:{},rawAttrs:t.attr,outputs:e.outputs};return e.inputs!=null&&(o.inputParams=e.inputs.reduce((n,s)=>(n[s.name]={type:s.type,inputIndexStart:s.start,inputIndexEnd:s.end},n),{})),e.attrs!=null&&(o.attrParams=e.attrs.reduce((n,s)=>{let a=s.type,i;switch(s.type){case"string":i=vm(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=vm(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"string[]":i=Dm(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Dm(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"number":i=Em(t.attr,s.tfName,s.defaultValue||0),i===void 0&&s.tfDeprecatedName&&(i=Em(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"number[]":i=Fm(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Fm(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"bool":i=km(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=km(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"bool[]":i=Om(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Om(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"shape":i=Am(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Am(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"shape[]":i=_m(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=_m(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"dtype":i=$m(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=$m(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"dtype[]":i=Rm(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Rm(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"func":i=gk(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=gk(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"tensor":case"tensors":break;default:throw new Error(`Unsupported param type: ${s.type} for op: ${t.op}`)}return n[s.name]={value:i,type:a},n},{})),o}mapFunction(t){let e=t.nodeDef,o=[],n=[],s={};e!=null&&(s=e.reduce((u,m)=>(u[m.name]=this.mapNode(m),m.op==="Const"&&n.push(u[m.name]),u),{}));let a=[],i=[];t.signature.inputArg.forEach(u=>{let[m]=sr(u.name),f={name:m,op:"Placeholder",inputs:[],inputNames:[],category:"graph",inputParams:{},attrParams:{dtype:{value:Hh(u.type),type:"dtype"}},children:[]};f.signatureKey=u.name,a.push(f),s[m]=f}),Object.keys(s).forEach(u=>{let m=s[u];m.inputNames.forEach((f,d)=>{let[h,,g]=sr(f),x=s[h];if(x.outputs!=null){let b=x.outputs.indexOf(g);if(b!==-1){let S=`${h}:${b}`;m.inputNames[d]=S}}m.inputs.push(x),x.children.push(m)})});let p=t.ret;t.signature.outputArg.forEach(u=>{let[m,f]=sr(p[u.name]),d=s[m];d!=null&&(d.defaultOutput=f,i.push(d))});let l=this.mapArgsToSignature(t);return{nodes:s,inputs:a,outputs:i,weights:n,placeholders:o,signature:l}}mapArgsToSignature(t){return{methodName:t.signature.name,inputs:t.signature.inputArg.reduce((e,o)=>(e[o.name]=this.mapArgToTensorInfo(o),e),{}),outputs:t.signature.outputArg.reduce((e,o)=>(e[o.name]=this.mapArgToTensorInfo(o,t.ret),e),{})}}mapArgToTensorInfo(t,e){let o=t.name;return e!=null&&(o=e[o]),{name:o,dtype:t.type}}};function S4(r){let t=F().global;if(typeof t.atob<"u")return t.atob(r);if(typeof Buffer<"u")return new Buffer(r,"base64").toString();throw new Error("Unable to decode base64 in this environment. Missing built-in atob() or Buffer()")}function xk(r,t){let e=Array.isArray(r)?String.fromCharCode.apply(null,r):S4(r);return t?e:e.toLowerCase()}function vm(r,t,e,o=!1){let n=r[t];return n!=null?xk(n.s,o):e}function km(r,t,e){let o=r[t];return o?o.b:e}function Em(r,t,e){let o=r[t]||{},n=o.i!=null?o.i:o.f!=null?o.f:e;return typeof n=="number"?n:parseInt(n,10)}function Hh(r){switch(typeof r=="string"&&(r=Ge[r]),r){case Ge.DT_FLOAT:case Ge.DT_HALF:return"float32";case Ge.DT_INT32:case Ge.DT_INT64:case Ge.DT_INT8:case Ge.DT_UINT8:return"int32";case Ge.DT_BOOL:return"bool";case Ge.DT_DOUBLE:return"float32";case Ge.DT_STRING:return"string";default:return null}}function gk(r,t,e){let o=r[t];return o&&o.func?o.func.name:e}function $m(r,t,e){let o=r[t];return o&&o.type?Hh(o.type):e}function Rm(r,t,e){let o=r[t];return o&&o.list&&o.list.type?o.list.type.map(n=>Hh(n)):e}function yk(r){if(!r.unknownRank)return r.dim!=null?r.dim.map(t=>typeof t.size=="number"?t.size:parseInt(t.size,10)):[]}function Am(r,t,e){let o=r[t];return o&&o.shape?yk(o.shape):e}function Fm(r,t,e){let o=r[t];return o?((o.list.f&&o.list.f.length?o.list.f:o.list.i)||[]).map(n=>typeof n=="number"?n:parseInt(n,10)):e}function Dm(r,t,e,o=!1){let n=r[t];return n&&n.list&&n.list.s?n.list.s.map(s=>xk(s,o)):e}function _m(r,t,e){let o=r[t];return o&&o.list&&o.list.shape?o.list.shape.map(n=>yk(n)):e}function Om(r,t,e){let o=r[t];return o&&o.list&&o.list.b?o.list.b:e}var Pm=class{constructor(t,e,o){this.node=t,this.tensorMap=e,this.context=o,this.inputs=[],this.attrs={},this.inputs=t.inputNames.map(n=>this.getInput(n)),t.rawAttrs!=null&&(this.attrs=Object.keys(t.rawAttrs).reduce((n,s)=>(n[s]=this.getAttr(s),n),{}))}getInput(t){return re(t,this.tensorMap,this.context)}getAttr(t,e){let o=this.node.rawAttrs[t];if(o.tensor!=null)return re(t,this.tensorMap,this.context);if(o.i!=null||o.f!=null)return Em(this.node.rawAttrs,t,e);if(o.s!=null)return vm(this.node.rawAttrs,t,e);if(o.b!=null)return km(this.node.rawAttrs,t,e);if(o.shape!=null)return Am(this.node.rawAttrs,t,e);if(o.type!=null)return $m(this.node.rawAttrs,t,e);if(o.list!=null){if(o.list.i!=null||o.list.f!=null)return Fm(this.node.rawAttrs,t,e);if(o.list.s!=null)return Dm(this.node.rawAttrs,t,e);if(o.list.shape!=null)return _m(this.node.rawAttrs,t,e);if(o.list.b!=null)return Om(this.node.rawAttrs,t,e);if(o.list.type!=null)return Rm(this.node.rawAttrs,t,e)}return e}};var It={};At(It,{OP_SCOPE_SUFFIX:()=>Sf,abs:()=>fe,acos:()=>bx,acosh:()=>Cx,add:()=>Et,addN:()=>Tx,all:()=>Sx,any:()=>wx,argMax:()=>Nx,argMin:()=>Ix,asin:()=>vx,asinh:()=>kx,atan:()=>Ex,atan2:()=>$x,atanh:()=>Rx,avgPool:()=>Np,avgPool3d:()=>Dx,basicLSTMCell:()=>_x,batchNorm:()=>uo,batchNorm2d:()=>Px,batchNorm3d:()=>Lx,batchNorm4d:()=>Bx,batchToSpaceND:()=>Ip,bincount:()=>vp,booleanMaskAsync:()=>mF,broadcastArgs:()=>Vx,broadcastTo:()=>mo,buffer:()=>tt,cast:()=>kt,ceil:()=>Mx,clipByValue:()=>zx,clone:()=>Ae,complex:()=>Ne,concat:()=>Dt,concat1d:()=>Wx,concat2d:()=>Gx,concat3d:()=>Ux,concat4d:()=>Hx,conv1d:()=>Kx,conv2d:()=>ho,conv2dTranspose:()=>qx,conv3d:()=>Xx,conv3dTranspose:()=>Yx,cos:()=>Zx,cosh:()=>Qx,cosineWindow:()=>uc,cumprod:()=>Jx,cumsum:()=>ty,denseBincount:()=>ey,depthToSpace:()=>ry,depthwiseConv2d:()=>ei,diag:()=>oy,dilation2d:()=>ny,div:()=>Ut,divNoNan:()=>sy,dot:()=>ay,dropout:()=>wF,einsum:()=>iy,elu:()=>$p,enclosingPowerOfTwo:()=>Qf,equal:()=>Ep,erf:()=>cy,euclideanNorm:()=>uy,exp:()=>je,expandDims:()=>zr,expm1:()=>my,eye:()=>Dp,fft:()=>si,fill:()=>fo,floor:()=>_p,floorDiv:()=>Cp,fused:()=>Jf,gather:()=>Op,gatherND:()=>TF,greater:()=>Bn,greaterEqual:()=>Pp,ifft:()=>Gn,imag:()=>lo,image:()=>ID,inTopKAsync:()=>IF,irfft:()=>sl,isFinite:()=>fy,isInf:()=>dy,isNaN:()=>hy,leakyRelu:()=>Lp,less:()=>gy,lessEqual:()=>ni,linalg:()=>vD,linspace:()=>xy,localResponseNormalization:()=>yy,log:()=>Wr,log1p:()=>Vp,logSigmoid:()=>by,logSoftmax:()=>Cy,logSumExp:()=>zp,logicalAnd:()=>Vn,logicalNot:()=>Wp,logicalOr:()=>Gp,logicalXor:()=>Ty,losses:()=>kD,lowerBound:()=>Sy,matMul:()=>St,max:()=>Nr,maxPool:()=>Hp,maxPool3d:()=>wy,maxPoolWithArgmax:()=>Ny,maximum:()=>Iy,mean:()=>Mn,meshgrid:()=>vy,min:()=>ec,minimum:()=>Kp,mirrorPad:()=>ky,mod:()=>Ey,moments:()=>$y,movingAverage:()=>dF,mul:()=>at,multiRNNCell:()=>Ry,multinomial:()=>Ay,neg:()=>be,norm:()=>Ln,notEqual:()=>qp,oneHot:()=>ax,ones:()=>Ir,onesLike:()=>Fy,op:()=>w,outerProduct:()=>Dy,pad:()=>vr,pad1d:()=>_y,pad2d:()=>Oy,pad3d:()=>Py,pad4d:()=>Ly,pool:()=>By,pow:()=>oi,prelu:()=>jp,print:()=>mp,prod:()=>Vy,raggedGather:()=>My,raggedTensorToTensor:()=>zy,rand:()=>Wy,randomGamma:()=>sb,randomNormal:()=>tl,randomStandardNormal:()=>ab,randomUniform:()=>el,range:()=>yo,real:()=>Vr,reciprocal:()=>ib,relu:()=>bo,relu6:()=>rl,reshape:()=>P,reverse:()=>Be,reverse1d:()=>cb,reverse2d:()=>pb,reverse3d:()=>lb,reverse4d:()=>ub,rfft:()=>ai,round:()=>ol,rsqrt:()=>mb,scalar:()=>lt,scatterND:()=>gF,searchSorted:()=>ic,selu:()=>fb,separableConv2d:()=>db,setdiff1dAsync:()=>hb,sigmoid:()=>wr,sign:()=>gb,signal:()=>ND,sin:()=>xb,sinh:()=>yb,slice:()=>yt,slice1d:()=>bb,slice2d:()=>Cb,slice3d:()=>Tb,slice4d:()=>Sb,softmax:()=>wb,softplus:()=>Mp,spaceToBatchND:()=>Xp,sparse:()=>ED,sparseToDense:()=>bF,spectral:()=>wD,split:()=>Gr,sqrt:()=>oc,square:()=>go,squaredDifference:()=>al,squeeze:()=>ii,stack:()=>Ce,step:()=>il,stridedSlice:()=>Nb,string:()=>$D,sub:()=>ut,sum:()=>wt,tan:()=>Ib,tanh:()=>Zi,tensor:()=>me,tensor1d:()=>he,tensor2d:()=>Co,tensor3d:()=>cx,tensor4d:()=>vb,tensor5d:()=>kb,tensor6d:()=>Eb,tile:()=>xo,topk:()=>$b,transpose:()=>yp,truncatedNormal:()=>Rb,unique:()=>Ab,unsortedSegmentSum:()=>Fb,unstack:()=>Ve,upperBound:()=>Db,variable:()=>_b,where:()=>mr,whereAsync:()=>pl,zeros:()=>Ye,zerosLike:()=>ri});var bk=(r,t,e,o=It)=>{switch(r.op){case"BiasAdd":case"AddV2":case"Add":return[o.add(C("a",r,t,e),C("b",r,t,e))];case"AddN":return[o.addN(C("tensors",r,t,e))];case"FloorMod":case"Mod":return[o.mod(C("a",r,t,e),C("b",r,t,e))];case"Mul":return[o.mul(C("a",r,t,e),C("b",r,t,e))];case"RealDiv":case"Div":return[o.div(C("a",r,t,e),C("b",r,t,e))];case"DivNoNan":return[o.divNoNan(C("a",r,t,e),C("b",r,t,e))];case"FloorDiv":return[o.floorDiv(C("a",r,t,e),C("b",r,t,e))];case"Sub":return[o.sub(C("a",r,t,e),C("b",r,t,e))];case"Minimum":return[o.minimum(C("a",r,t,e),C("b",r,t,e))];case"Maximum":return[o.maximum(C("a",r,t,e),C("b",r,t,e))];case"Pow":return[o.pow(C("a",r,t,e),C("b",r,t,e))];case"SquaredDifference":return[o.squaredDifference(C("a",r,t,e),C("b",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Ck=(r,t,e,o=It)=>{switch(r.op){case"Abs":case"ComplexAbs":return[o.abs(C("x",r,t,e))];case"Acos":return[o.acos(C("x",r,t,e))];case"Acosh":return[o.acosh(C("x",r,t,e))];case"Asin":return[o.asin(C("x",r,t,e))];case"Asinh":return[o.asinh(C("x",r,t,e))];case"Atan":return[o.atan(C("x",r,t,e))];case"Atan2":return[o.atan2(C("x",r,t,e),C("y",r,t,e))];case"Atanh":return[o.atanh(C("x",r,t,e))];case"Ceil":return[o.ceil(C("x",r,t,e))];case"Complex":return[o.complex(C("real",r,t,e),C("imag",r,t,e))];case"Cos":return[o.cos(C("x",r,t,e))];case"Cosh":return[o.cosh(C("x",r,t,e))];case"Elu":return[o.elu(C("x",r,t,e))];case"Erf":return[o.erf(C("x",r,t,e))];case"Exp":return[o.exp(C("x",r,t,e))];case"Expm1":return[o.expm1(C("x",r,t,e))];case"Floor":return[o.floor(C("x",r,t,e))];case"Log":return[o.log(C("x",r,t,e))];case"Log1p":return[o.log1p(C("x",r,t,e))];case"Imag":return[o.imag(C("x",r,t,e))];case"Neg":return[o.neg(C("x",r,t,e))];case"Reciprocal":return[o.reciprocal(C("x",r,t,e))];case"Real":return[o.real(C("x",r,t,e))];case"Relu":return[o.relu(C("x",r,t,e))];case"Round":return[o.round(C("x",r,t,e))];case"Selu":return[o.selu(C("x",r,t,e))];case"Sigmoid":return[o.sigmoid(C("x",r,t,e))];case"Sin":return[o.sin(C("x",r,t,e))];case"Sign":return[o.sign(C("x",r,t,e))];case"Sinh":return[o.sinh(C("x",r,t,e))];case"Softplus":return[o.softplus(C("x",r,t,e))];case"Sqrt":return[o.sqrt(C("x",r,t,e))];case"Square":return[o.square(C("x",r,t,e))];case"Tanh":return[o.tanh(C("x",r,t,e))];case"Tan":return[o.tan(C("x",r,t,e))];case"ClipByValue":return[o.clipByValue(C("x",r,t,e),C("clipValueMin",r,t,e),C("clipValueMax",r,t,e))];case"Relu6":return[o.relu6(C("x",r,t,e))];case"Rsqrt":return[o.rsqrt(re(r.inputNames[0],t,e))];case"Prod":return[o.prod(C("x",r,t,e),C("axes",r,t,e))];case"LeakyRelu":return[o.leakyRelu(C("x",r,t,e),C("alpha",r,t,e))];case"Prelu":return[o.prelu(C("x",r,t,e),C("alpha",r,t,e))];case"IsNan":return[o.isNaN(re(r.inputNames[0],t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function _e(r,t,e=""){if(!(typeof r=="number"||typeof t=="number")){y.assert(r.length===t.length,()=>e+` Shapes ${r} and ${t} must match`);for(let o=0;o<r.length;o++){let n=r[o],s=t[o];y.assert(n<0||s<0||n===s,()=>e+` Shapes ${r} and ${t} must match`)}}}function Tk(r){return!(typeof r=="number"||r.some(t=>t<0))}function Di(r,t,e){let o=Lm(r,e),n=!Tk(o);if(n&&t.length===0)throw new Error(`Tried to calculate elements of an empty list with non-fully-defined elementShape: ${o}`);if(n&&t.forEach(s=>{o=Lm(s.shape,o)}),!Tk(o))throw new Error(`Non-fully-defined elementShape: ${o}`);return o}function Lm(r,t){if(typeof r=="number")return t;if(typeof t=="number")return r;if(r.length!==t.length)throw new Error(`Incompatible ranks during merge: ${r} vs. ${t}`);let e=[];for(let o=0;o<r.length;++o){let n=r[o],s=t[o];if(n>=0&&s>=0&&n!==s)throw new Error(`Incompatible shape during merge: ${r} vs. ${t}`);e[o]=n>=0?n:s}return e}var Bm=class{constructor(t,e,o,n,s,a,i){this.name=t,this.dtype=e,this.maxSize=o,this.elementShape=n,this.identicalElementShapes=s,this.dynamicSize=a,this.clearAfterRead=i,this.tensors=[],this.closed_=!1,this.idTensor=lt(0),ur(this.idTensor)}get id(){return this.idTensor.id}get closed(){return this.closed_}clearAndClose(t){this.tensors.forEach(e=>{(t==null||!t.has(e.tensor.id))&&e.tensor.dispose()}),this.tensors=[],this.closed_=!0,this.idTensor.dispose()}size(){return this.tensors.length}read(t){if(this.closed_)throw new Error(`TensorArray ${this.name} has already been closed.`);if(t<0||t>=this.size())throw new Error(`Tried to read from index ${t}, but array size is: ${this.size()}`);let e=this.tensors[t];if(e.cleared)throw new Error(`TensorArray ${this.name}: Could not read index ${t} twice because it was cleared after a previous read (perhaps try setting clear_after_read = false?).`);return this.clearAfterRead&&(e.cleared=!0),e.read=!0,e.tensor}readMany(t){return t.map(e=>this.read(e))}write(t,e){if(this.closed_)throw new Error(`TensorArray ${this.name} has already been closed.`);if(t<0||!this.dynamicSize&&t>=this.maxSize)throw new Error(`Tried to write to index ${t}, but array is not resizeable and size is: ${this.maxSize}`);let o=this.tensors[t]||{};if(e.dtype!==this.dtype)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${t},
          because the value dtype is ${e.dtype}, but TensorArray dtype is ${this.dtype}.`);if(this.size()===0&&(this.elementShape==null||this.elementShape.length===0)&&(this.elementShape=e.shape),_e(this.elementShape,e.shape,`TensorArray ${this.name}: Could not write to TensorArray index ${t}.`),o.read)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${t}, because it has already been read.`);if(o.written)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${t}, because it has already been written.`);o.tensor=e,ur(e),o.written=!0,this.tensors[t]=o}writeMany(t,e){if(t.length!==e.length)throw new Error(`TensorArray ${this.name}: could not write multiple tensors,because the index size: ${t.length} is not the same as tensors size: ${e.length}.`);t.forEach((o,n)=>this.write(o,e[n]))}gather(t,e){if(e&&e!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but gather requested dtype ${e}`);if(t)t=t.slice(0,this.size());else{t=[];for(let n=0;n<this.size();n++)t.push(n)}if(t.length===0)return me([],[0].concat(this.elementShape));let o=this.readMany(t);return _e(this.elementShape,o[0].shape,"TensorArray shape mismatch: "),Ce(o,0)}concat(t){if(t&&t!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but concat requested dtype ${t}`);if(this.size()===0)return me([],[0].concat(this.elementShape));let e=[];for(let n=0;n<this.size();n++)e.push(n);let o=this.readMany(e);return _e(this.elementShape,o[0].shape,`TensorArray shape mismatch: tensor array shape (${this.elementShape}) vs first tensor shape (${o[0].shape})`),Dt(o,0)}scatter(t,e){if(e.dtype!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but tensor has dtype ${e.dtype}`);if(t.length!==e.shape[0])throw new Error(`Expected len(indices) == tensor.shape[0], but saw: ${t.length} vs. ${e.shape[0]}`);let o=Math.max(...t);if(!this.dynamicSize&&o>=this.maxSize)throw new Error(`Max index must be < array size (${o}  vs. ${this.maxSize})`);this.writeMany(t,Ve(e,0))}split(t,e){if(e.dtype!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but tensor has dtype ${e.dtype}`);let o=0,n=t.map(c=>(o+=c,o));if(o!==e.shape[0])throw new Error(`Expected sum of lengths to be equal to
          tensor.shape[0], but sum of lengths is
        ${o}, and tensor's shape is: ${e.shape}`);if(!this.dynamicSize&&t.length!==this.maxSize)throw new Error(`TensorArray's size is not equal to the size of lengths (${this.maxSize} vs. ${t.length}), and the TensorArray is not marked as dynamically resizeable`);let s=o===0?0:e.size/o,a=[];Jt(()=>{e=P(e,[1,o,s]);for(let c=0;c<t.length;++c){let l=[0,c===0?0:n[c-1],0],u=[1,t[c],s];a[c]=P(yt(e,l,u),this.elementShape)}return a});let i=[];for(let c=0;c<t.length;c++)i[c]=c;this.writeMany(i,a)}};var _i=class r{constructor(t,e,o,n=-1){this.tensors=t,this.elementShape=e,this.elementDtype=o,t?.forEach(s=>{if(o!==s.dtype)throw new Error(`Invalid data types; op elements ${o}, but list elements ${s.dtype}`);_e(e,s.shape,"TensorList shape mismatch: "),ur(s)}),this.idTensor=lt(0),this.maxNumElements=n,ur(this.idTensor)}get id(){return this.idTensor.id}copy(){return new r([...this.tensors],this.elementShape,this.elementDtype)}clearAndClose(t){this.tensors.forEach(e=>{(t==null||!t.has(e.id))&&e.dispose()}),this.tensors.length=0,this.idTensor.dispose()}size(){return this.tensors.length}stack(t,e,o=-1){if(e!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e}, but list elements ${this.elementDtype}`);if(o!==-1&&this.tensors.length!==o)throw new Error(`Operation expected a list with ${o} elements but got a list with ${this.tensors.length} elements.`);_e(t,this.elementShape,"TensorList shape mismatch: ");let n=Di(this.elementShape,this.tensors,t);return Jt(()=>{let s=this.tensors.map(a=>P(a,n));return Ce(s,0)})}popBack(t,e){if(e!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e}, but list elements ${this.elementDtype}`);if(this.size()===0)throw new Error("Trying to pop from an empty list.");let o=Di(this.elementShape,this.tensors,t),n=this.tensors.pop();return n.kept=!1,_e(n.shape,t,"TensorList shape mismatch: "),P(n,o)}pushBack(t){if(t.dtype!==this.elementDtype)throw new Error(`Invalid data types; op elements ${t.dtype}, but list elements ${this.elementDtype}`);if(_e(t.shape,this.elementShape,"TensorList shape mismatch: "),this.maxNumElements===this.size())throw new Error("Trying to push element into a full list.");ur(t),this.tensors.push(t)}resize(t){if(t<0)throw new Error(`TensorListResize expects size to be non-negative. Got: ${t}`);if(this.maxNumElements!==-1&&t>this.maxNumElements)throw new Error(`TensorListResize input size ${t} is greater maxNumElement ${this.maxNumElements}.`);let e=new r([],this.elementShape,this.elementDtype,this.maxNumElements);e.tensors.length=t;for(let o=0;o<Math.min(this.tensors.length,t);++o)e.tensors[o]=this.tensors[o];return e}getItem(t,e,o){if(o!==this.elementDtype)throw new Error(`Invalid data types; op elements ${o}, but list elements ${this.elementDtype}`);if(t<0||t>this.tensors.length)throw new Error(`Trying to access element ${t} in a list with ${this.tensors.length} elements.`);if(this.tensors[t]==null)throw new Error(`element at index ${t} is null.`);_e(this.tensors[t].shape,e,"TensorList shape mismatch: ");let n=Di(this.elementShape,this.tensors,e);return P(this.tensors[t],n)}setItem(t,e){if(e.dtype!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e.dtype}, but list elements ${this.elementDtype}`);if(t<0||this.maxNumElements!==-1&&t>=this.maxNumElements)throw new Error(`Trying to set element ${t} in a list with max ${this.maxNumElements} elements.`);_e(this.elementShape,e.shape,"TensorList shape mismatch: "),ur(e),this.tensors[t]!=null&&(this.tensors[t].kept=!1),this.tensors[t]=e}gather(t,e,o){if(e!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e}, but list elements ${this.elementDtype}`);_e(this.elementShape,o,"TensorList shape mismatch: "),t=t.slice(0,this.size());let n=Di(this.elementShape,this.tensors,o);return t.length===0?me([],[0].concat(n)):Jt(()=>{let s=t.map(a=>P(this.tensors[a],n));return Ce(s,0)})}concat(t,e){if(t&&t!==this.elementDtype)throw new Error(`TensorList dtype is ${this.elementDtype} but concat requested dtype ${t}`);_e(this.elementShape,e,"TensorList shape mismatch: ");let o=Di(this.elementShape,this.tensors,e);return this.size()===0?me([],[0].concat(o)):Jt(()=>{let n=this.tensors.map(s=>P(s,o));return Dt(n,0)})}};function Sk(r,t,e){let o=r.dtype;if(r.shape.length<1)throw new Error(`Tensor must be at least a vector, but saw shape: ${r.shape}`);if(r.dtype!==e)throw new Error(`Invalid data types; op elements ${r.dtype}, but list elements ${e}`);let n=r.shape.slice(1);_e(n,t,"TensorList shape mismatch: ");let s=Ve(r);return new _i(s,t,o)}function wk(r,t,e,o){return new _i([],r,t,o)}function Nk(r,t,e,o){if(t.length!==r.shape[0])throw new Error(`Expected len(indices) == tensor.shape[0], but saw: ${t.length} vs. ${r.shape[0]}`);let n=Math.max(...t);if(o!=null&&o!==-1&&n>=o)throw new Error(`Max index must be < array size (${n}  vs. ${o})`);let s=new _i([],e,r.dtype,o),a=Ve(r,0);return t.forEach((i,c)=>{s.setItem(i,a[c])}),s}function Ik(r,t,e){let o=0,n=t.map(l=>(o+=l,o));if(o!==r.shape[0])throw new Error(`Expected sum of lengths to be equal to
          tensor.shape[0], but sum of lengths is
        ${o}, and tensor's shape is: ${r.shape}`);let s=r.shape.slice(1),a=Lm(s,e),i=o===0?0:r.size/o,c=Jt(()=>{let l=[];r=P(r,[1,o,i]);for(let u=0;u<t.length;++u){let f=[0,u===0?0:n[u-1],0],d=[1,t[u],i];l[u]=P(yt(r,f,d),a)}return r.dispose(),l}),p=new _i([],e,r.dtype,t.length);for(let l=0;l<c.length;l++)p.setItem(l,c[l]);return p}var vk=async(r,t,e)=>{switch(r.op){case"If":case"StatelessIf":{let o=C("thenBranch",r,t,e),n=C("elseBranch",r,t,e),s=C("cond",r,t,e),a=C("args",r,t,e);return(await s.data())[0]?e.functionMap[o].executeFunctionAsync(a,e.tensorArrayMap,e.tensorListMap):e.functionMap[n].executeFunctionAsync(a,e.tensorArrayMap,e.tensorListMap)}case"While":case"StatelessWhile":{let o=C("body",r,t,e),n=C("cond",r,t,e),s=C("args",r,t,e),a=await e.functionMap[n].executeFunctionAsync(s,e.tensorArrayMap,e.tensorListMap),i=s.map(l=>l.id),c=await a[0].data();a.forEach(l=>{!l.kept&&i.indexOf(l.id)===-1&&l.dispose()});let p=s;for(;c[0];){let l=p;p=await e.functionMap[o].executeFunctionAsync(p,e.tensorArrayMap,e.tensorListMap);let u=p.map(f=>f.id);l.forEach(f=>{!f.kept&&i.indexOf(f.id)===-1&&u.indexOf(f.id)===-1&&f.dispose()});let m=await e.functionMap[n].executeFunctionAsync(p,e.tensorArrayMap,e.tensorListMap);c=await m[0].data(),m.forEach(f=>{!f.kept&&i.indexOf(f.id)===-1&&u.indexOf(f.id)===-1&&f.dispose()})}return p}case"LoopCond":{let o=C("pred",r,t,e);return[gr(o)]}case"Switch":{let o=C("pred",r,t,e),n=C("data",r,t,e);return n.kept||(n=gr(n)),(await o.data())[0]?[void 0,n]:[n,void 0]}case"Merge":{let o=r.inputNames.find(n=>re(n,t,e)!==void 0);if(o){let n=re(o,t,e);return[gr(n)]}return}case"Enter":{let o=C("frameName",r,t,e),n=C("tensor",r,t,e);return e.enterFrame(o),[gr(n)]}case"Exit":{let o=C("tensor",r,t,e);return e.exitFrame(),[gr(o)]}case"NextIteration":{let o=C("tensor",r,t,e);return e.nextIteration(),[gr(o)]}case"TensorArrayV3":{let o=C("size",r,t,e),n=C("dtype",r,t,e),s=C("elementShape",r,t,e),a=C("dynamicSize",r,t,e),i=C("clearAfterRead",r,t,e),c=C("identicalElementShapes",r,t,e),p=C("name",r,t,e),l=new Bm(p,n,o,s,c,a,i);return e.addTensorArray(l),[l.idTensor,lt(1)]}case"TensorArrayWriteV3":{let o=C("tensorArrayId",r,t,e),n=C("index",r,t,e),s=C("tensor",r,t,e),a=e.getTensorArray(o.id);return a.write(n,s),[a.idTensor]}case"TensorArrayReadV3":{let o=C("tensorArrayId",r,t,e),n=C("index",r,t,e);return[e.getTensorArray(o.id).read(n)]}case"TensorArrayGatherV3":{let o=C("tensorArrayId",r,t,e),n=C("indices",r,t,e),s=C("dtype",r,t,e);return[e.getTensorArray(o.id).gather(n,s)]}case"TensorArrayScatterV3":{let o=C("tensorArrayId",r,t,e),n=C("indices",r,t,e),s=C("tensor",r,t,e),a=e.getTensorArray(o.id);return a.scatter(n,s),[a.idTensor]}case"TensorArrayConcatV3":{let o=C("tensorArrayId",r,t,e),n=e.getTensorArray(o.id),s=C("dtype",r,t,e);return[n.concat(s)]}case"TensorArraySplitV3":{let o=C("tensorArrayId",r,t,e),n=C("tensor",r,t,e),s=C("lengths",r,t,e),a=e.getTensorArray(o.id);return a.split(s,n),[a.idTensor]}case"TensorArraySizeV3":{let o=C("tensorArrayId",r,t,e),n=e.getTensorArray(o.id);return[lt(n.size(),"int32")]}case"TensorArrayCloseV3":{let o=C("tensorArrayId",r,t,e),n=e.getTensorArray(o.id);return n.clearAndClose(),[n.idTensor]}case"TensorListSetItem":{let o=C("tensorListId",r,t,e),n=C("index",r,t,e),s=C("tensor",r,t,e),a=e.getTensorList(o.id);return a.setItem(n,s),[a.idTensor]}case"TensorListGetItem":{let o=C("tensorListId",r,t,e),n=C("index",r,t,e),s=C("elementShape",r,t,e),a=C("elementDType",r,t,e);return[e.getTensorList(o.id).getItem(n,s,a)]}case"TensorListScatterV2":case"TensorListScatter":{let o=C("indices",r,t,e),n=C("tensor",r,t,e),s=C("elementShape",r,t,e),a=C("numElements",r,t,e),i=Nk(n,o,s,a);return e.addTensorList(i),[i.idTensor]}case"TensorListReserve":case"EmptyTensorList":{let o=C("elementShape",r,t,e),n=C("elementDType",r,t,e),s;r.op==="TensorListReserve"?s="numElements":s="maxNumElements";let a=C(s,r,t,e),i=r.op==="TensorListReserve"?-1:a,c=wk(o,n,a,i);return e.addTensorList(c),[c.idTensor]}case"TensorListGather":{let o=C("tensorListId",r,t,e),n=C("indices",r,t,e),s=C("elementShape",r,t,e),a=C("elementDType",r,t,e);return[e.getTensorList(o.id).gather(n,a,s)]}case"TensorListStack":{let o=C("tensorListId",r,t,e),n=C("elementShape",r,t,e),s=C("elementDType",r,t,e),a=C("numElements",r,t,e);return[e.getTensorList(o.id).stack(n,s,a)]}case"TensorListFromTensor":{let o=C("tensor",r,t,e),n=C("elementShape",r,t,e),s=C("elementDType",r,t,e),a=Sk(o,n,s);return e.addTensorList(a),[a.idTensor]}case"TensorListConcat":case"TensorListConcatV2":{let o=C("tensorListId",r,t,e),n=e.getTensorList(o.id),s=C("dtype",r,t,e),a=C("elementShape",r,t,e);return[n.concat(s,a)]}case"TensorListPushBack":{let o=C("tensorListId",r,t,e),n=C("tensor",r,t,e),s=e.getTensorList(o.id);return s.pushBack(n),[s.idTensor]}case"TensorListPopBack":{let o=C("tensorListId",r,t,e),n=C("elementShape",r,t,e),s=C("elementDType",r,t,e);return[e.getTensorList(o.id).popBack(n,s)]}case"TensorListSplit":{let o=C("tensor",r,t,e),n=C("elementShape",r,t,e),s=C("lengths",r,t,e),a=Ik(o,s,n);return e.addTensorList(a),[a.idTensor]}case"TensorListLength":{let o=C("tensorListId",r,t,e),n=e.getTensorList(o.id);return[lt(n.size(),"int32")]}case"TensorListResize":{let o=C("tensorListId",r,t,e),n=C("size",r,t,e),a=e.getTensorList(o.id).resize(n);return e.addTensorList(a),[a.idTensor]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};function kk(r,t,e){let[o,n]=C("fusedOps",r,t,e),s=o==="biasadd",a=!s,i=n==="prelu",c=o==="fusedbatchnorm",p=C("numArgs",r,t,e);if(s){if(i&&p!==2)throw new Error("FusedConv2d and DepthwiseConv2d with BiasAdd and Prelu must have two extra arguments: bias and alpha.");if(!i&&s&&p!==1)throw new Error("FusedConv2d and DepthwiseConv2d with BiasAdd must have one extra argument: bias.")}if(c)throw new Error("FusedConv2d and DepthwiseConv2d with FusedBatchNorm is not supported");let l=C("strides",r,t,e),u=Dc(r,t,e),m=C("dataFormat",r,t,e).toUpperCase(),f=C("dilations",r,t,e),[d,h]=C("args",r,t,e);a&&(h=d,d=void 0);let g=C("leakyreluAlpha",r,t,e);return{stride:l,pad:u,dataFormat:m,dilations:f,biasArg:d,preluArg:h,activationFunc:n,leakyreluAlpha:g}}var Ek=(r,t,e,o=It)=>{switch(r.op){case"Conv1D":{let n=C("stride",r,t,e),s=C("pad",r,t,e),a=C("dataFormat",r,t,e).toUpperCase(),i=C("dilation",r,t,e);return[o.conv1d(C("x",r,t,e),C("filter",r,t,e),n,s,a,i)]}case"Conv2D":{let n=C("strides",r,t,e),s=Dc(r,t,e),a=C("dataFormat",r,t,e).toUpperCase(),i=C("dilations",r,t,e);return[o.conv2d(C("x",r,t,e),C("filter",r,t,e),[n[1],n[2]],s,a,[i[1],i[2]])]}case"_FusedConv2D":{let{stride:n,pad:s,dataFormat:a,dilations:i,biasArg:c,preluArg:p,activationFunc:l,leakyreluAlpha:u}=kk(r,t,e);return[o.fused.conv2d({x:C("x",r,t,e),filter:C("filter",r,t,e),strides:[n[1],n[2]],pad:s,dataFormat:a,dilations:[i[1],i[2]],bias:c,activation:l,preluActivationWeights:p,leakyreluAlpha:u})]}case"FusedDepthwiseConv2dNative":{let{stride:n,pad:s,dataFormat:a,dilations:i,biasArg:c,preluArg:p,activationFunc:l,leakyreluAlpha:u}=kk(r,t,e);return[o.fused.depthwiseConv2d({x:C("x",r,t,e),filter:C("filter",r,t,e),strides:[n[1],n[2]],pad:s,dataFormat:a,dilations:[i[1],i[2]],bias:c,activation:l,preluActivationWeights:p,leakyreluAlpha:u})]}case"Conv2DBackpropInput":case"Conv2dTranspose":{let n=C("outputShape",r,t,e),s=C("strides",r,t,e),a=Dc(r,t,e);return[o.conv2dTranspose(C("x",r,t,e),C("filter",r,t,e),n,[s[1],s[2]],a)]}case"DepthwiseConv2dNative":case"DepthwiseConv2d":{let n=C("strides",r,t,e),s=Dc(r,t,e),a=C("dilations",r,t,e),i=C("dataFormat",r,t,e).toUpperCase();return[o.depthwiseConv2d(C("input",r,t,e),C("filter",r,t,e),[n[1],n[2]],s,i,[a[1],a[2]])]}case"Conv3D":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("dataFormat",r,t,e).toUpperCase(),i=C("dilations",r,t,e);return[o.conv3d(C("x",r,t,e),C("filter",r,t,e),[n[1],n[2],n[3]],s,a,[i[1],i[2],i[3]])]}case"AvgPool":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("kernelSize",r,t,e);return[o.avgPool(C("x",r,t,e),[a[1],a[2]],[n[1],n[2]],s)]}case"MaxPool":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("kernelSize",r,t,e);return[o.maxPool(C("x",r,t,e),[a[1],a[2]],[n[1],n[2]],s)]}case"MaxPoolWithArgmax":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("kernelSize",r,t,e),i=C("includeBatchInIndex",r,t,e),{result:c,indexes:p}=o.maxPoolWithArgmax(C("x",r,t,e),[a[1],a[2]],[n[1],n[2]],s,i);return[c,p]}case"AvgPool3D":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("kernelSize",r,t,e);return[o.avgPool3d(C("x",r,t,e),[a[1],a[2],a[3]],[n[1],n[2],n[3]],s)]}case"MaxPool3D":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("kernelSize",r,t,e);return[o.maxPool3d(C("x",r,t,e),[a[1],a[2],a[3]],[n[1],n[2],n[3]],s)]}case"Dilation2D":{let n=C("strides",r,t,e),s=C("pad",r,t,e),a=C("dilations",r,t,e),i=n[1],c=n[2],p=a[1],l=a[2];return[o.dilation2d(C("x",r,t,e),C("filter",r,t,e),[i,c],s,[p,l],"NHWC")]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var $k=(r,t,e,o=It)=>{switch(r.op){case"Fill":{let n=C("shape",r,t,e),s=C("dtype",r,t,e),a=C("value",r,t,e);return[o.fill(n,a,s)]}case"LinSpace":{let n=C("start",r,t,e),s=C("stop",r,t,e),a=C("num",r,t,e);return[o.linspace(n,s,a)]}case"Multinomial":{let n=C("logits",r,t,e),s=C("numSamples",r,t,e),a=C("seed",r,t,e);return[o.multinomial(n,s,a)]}case"OneHot":{let n=C("indices",r,t,e),s=C("depth",r,t,e),a=C("onValue",r,t,e),i=C("offValue",r,t,e),c=C("dtype",r,t,e);return[o.oneHot(n,s,a,i,c)]}case"Ones":return[o.ones(C("shape",r,t,e),C("dtype",r,t,e))];case"OnesLike":return[o.onesLike(C("x",r,t,e))];case"RandomStandardNormal":return[o.randomStandardNormal(C("shape",r,t,e),C("dtype",r,t,e),C("seed",r,t,e))];case"RandomUniform":return[o.randomUniform(C("shape",r,t,e),C("minval",r,t,e),C("maxval",r,t,e),C("dtype",r,t,e))];case"Range":{let n=C("start",r,t,e),s=C("stop",r,t,e),a=C("step",r,t,e);return[o.range(n,s,a,C("dtype",r,t,e))]}case"TruncatedNormal":{let n=C("shape",r,t,e),s=C("mean",r,t,e),a=C("stdDev",r,t,e),i=C("seed",r,t,e);return[o.truncatedNormal(n,s,a,C("dtype",r,t,e),i)]}case"Zeros":return[o.zeros(C("shape",r,t,e),C("dtype",r,t,e))];case"ZerosLike":return[o.zerosLike(C("x",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function Kh(r,t,e){let o=C("boxes",r,t,e),n=C("scores",r,t,e),s=C("maxOutputSize",r,t,e),a=C("iouThreshold",r,t,e),i=C("scoreThreshold",r,t,e),c=C("softNmsSigma",r,t,e);return{boxes:o,scores:n,maxOutputSize:s,iouThreshold:a,scoreThreshold:i,softNmsSigma:c}}var Rk=async(r,t,e,o,n=It)=>{switch(r.op){case"NonMaxSuppressionV5":{let{boxes:s,scores:a,maxOutputSize:i,iouThreshold:c,scoreThreshold:p,softNmsSigma:l}=Kh(r,t,e),u=await n.image.nonMaxSuppressionWithScoreAsync(s,a,i,c,p,l);return[u.selectedIndices,u.selectedScores]}case"NonMaxSuppressionV4":{let{boxes:s,scores:a,maxOutputSize:i,iouThreshold:c,scoreThreshold:p}=Kh(r,t,e),l=C("padToMaxOutputSize",r,t,e),u=await n.image.nonMaxSuppressionPaddedAsync(s,a,i,c,p,l);return[u.selectedIndices,u.validOutputs]}case"NonMaxSuppressionV3":case"NonMaxSuppressionV2":{let{boxes:s,scores:a,maxOutputSize:i,iouThreshold:c,scoreThreshold:p}=Kh(r,t,e);return[await n.image.nonMaxSuppressionAsync(s,a,i,c,p)]}case"Where":{let s=n.cast(C("condition",r,t,e),"bool"),a=[await n.whereAsync(s)];return s.dispose(),a}case"ListDiff":return n.setdiff1dAsync(C("x",r,t,e),C("y",r,t,e));default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Ak=(r,t,e,o=It)=>{switch(r.op){case"LowerBound":{let n=C("sortedSequence",r,t,e),s=C("values",r,t,e);return[o.lowerBound(n,s)]}case"TopKV2":{let n=C("x",r,t,e),s=C("k",r,t,e),a=C("sorted",r,t,e),i=o.topk(n,s,a);return[i.values,i.indices]}case"UpperBound":{let n=C("sortedSequence",r,t,e),s=C("values",r,t,e);return[o.upperBound(n,s)]}case"Unique":{let n=C("x",r,t,e),s=o.unique(n);return[s.values,s.indices]}case"UniqueV2":{let n=C("x",r,t,e),s=C("axis",r,t,e),a=o.unique(n,s);return[a.values,a.indices]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Fk=(r,t,e,o=It)=>{switch(r.op){case"Const":return t[r.name];case"PlaceholderWithDefault":let n=C("default",r,t,e);return[re(r.name,t,e)||n];case"Placeholder":return[re(r.name,t,e)];case"Identity":case"StopGradient":case"FakeQuantWithMinMaxVars":{let l=C("x",r,t,e);return[gr(l)]}case"IdentityN":return C("x",r,t,e).map(l=>gr(l));case"Snapshot":let s=C("x",r,t,e);return[gr(s)];case"Shape":return[o.tensor1d(C("x",r,t,e).shape,"int32")];case"ShapeN":return C("x",r,t,e).map(l=>o.tensor1d(l.shape));case"Size":return[o.scalar(C("x",r,t,e).size,"int32")];case"Rank":return[o.scalar(C("x",r,t,e).rank,"int32")];case"NoOp":return[o.scalar(1)];case"Print":let a=C("x",r,t,e),i=C("data",r,t,e),c=C("message",r,t,e),p=C("summarize",r,t,e);console.warn("The graph has a tf.print() operation,usually used for debugging, which slows down performance."),console.log(c);for(let l=0;l<i.length;l++)console.log(Array.prototype.slice.call(i[l].dataSync()).slice(0,p));return[a];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Vm=class{constructor(t,e){this.keyDType=t,this.valueDType=e,this.handle=lt(0),this.tensorMap=new Map,ur(this.handle)}get id(){return this.handle.id}clearAndClose(){this.tensorMap.forEach(t=>t.dispose()),this.tensorMap.clear(),this.handle.dispose()}size(){return this.tensorMap.size}tensorSize(){return lt(this.size(),"int32")}async import(t,e){this.checkKeyAndValueTensor(t,e);let o=await t.data();return this.tensorMap.forEach(n=>n.dispose()),this.tensorMap.clear(),Jt(()=>{let n=Ve(e),s=o.length,a=n.length;y.assert(s===a,()=>`The number of elements doesn't match, keys has ${s} elements, the values has ${a} elements.`);for(let i=0;i<s;i++){let c=o[i],p=n[i];ur(p),this.tensorMap.set(c,p)}return this.handle})}async find(t,e){this.checkKeyAndValueTensor(t,e);let o=await t.data();return Jt(()=>{let n=[];for(let s=0;s<o.length;s++){let a=o[s],i=this.findWithDefault(a,e);n.push(i)}return Ce(n)})}findWithDefault(t,e){let o=this.tensorMap.get(t);return o??e}checkKeyAndValueTensor(t,e){if(t.dtype!==this.keyDType)throw new Error(`Expect key dtype ${this.keyDType}, but got ${t.dtype}`);if(e.dtype!==this.valueDType)throw new Error(`Expect value dtype ${this.valueDType}, but got ${e.dtype}`)}};var Dk=async(r,t,e,o)=>{switch(r.op){case"HashTable":case"HashTableV2":{let n=C("keyDType",r,t,e),s=C("valueDType",r,t,e),a=new Vm(n,s);return o.addHashTable(r.name,a),[a.handle]}case"LookupTableImport":case"LookupTableImportV2":{let n=C("tableHandle",r,t,e,o),s=C("keys",r,t,e),a=C("values",r,t,e);return[await o.getHashTableById(n.id).import(s,a)]}case"LookupTableFind":case"LookupTableFindV2":{let n=C("tableHandle",r,t,e,o),s=C("keys",r,t,e),a=C("defaultValue",r,t,e);return[await o.getHashTableById(n.id).find(s,a)]}case"LookupTableSize":case"LookupTableSizeV2":{let n=C("tableHandle",r,t,e,o);return[o.getHashTableById(n.id).tensorSize()]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var _k=(r,t,e,o=It)=>{switch(r.op){case"ResizeBilinear":{let n=C("images",r,t,e),s=C("size",r,t,e),a=C("alignCorners",r,t,e),i=C("halfPixelCenters",r,t,e);return[o.image.resizeBilinear(n,[s[0],s[1]],a,i)]}case"ResizeNearestNeighbor":{let n=C("images",r,t,e),s=C("size",r,t,e),a=C("alignCorners",r,t,e),i=C("halfPixelCenters",r,t,e);return[o.image.resizeNearestNeighbor(n,[s[0],s[1]],a,i)]}case"CropAndResize":{let n=C("image",r,t,e),s=C("boxes",r,t,e),a=C("boxInd",r,t,e),i=C("cropSize",r,t,e),c=C("method",r,t,e),p=C("extrapolationValue",r,t,e);return[o.image.cropAndResize(n,s,a,i,c,p)]}case"ImageProjectiveTransformV3":{let n=C("images",r,t,e),s=C("transforms",r,t,e),a=C("outputShape",r,t,e),i=C("fillValue",r,t,e),c=C("interpolation",r,t,e),p=C("fillMode",r,t,e);return[o.image.transform(n,s,c.toLowerCase(),p.toLowerCase(),i,a)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Ok=(r,t,e,o=It)=>{switch(r.op){case"Equal":return[o.equal(C("a",r,t,e),C("b",r,t,e))];case"NotEqual":return[o.notEqual(C("a",r,t,e),C("b",r,t,e))];case"Greater":return[o.greater(C("a",r,t,e),C("b",r,t,e))];case"GreaterEqual":return[o.greaterEqual(C("a",r,t,e),C("b",r,t,e))];case"Less":return[o.less(C("a",r,t,e),C("b",r,t,e))];case"LessEqual":return[o.lessEqual(C("a",r,t,e),C("b",r,t,e))];case"LogicalAnd":return[o.logicalAnd(C("a",r,t,e),C("b",r,t,e))];case"LogicalNot":return[o.logicalNot(C("a",r,t,e))];case"LogicalOr":return[o.logicalOr(C("a",r,t,e),C("b",r,t,e))];case"Select":case"SelectV2":return[o.where(C("condition",r,t,e),C("a",r,t,e),C("b",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Pk=(r,t,e,o=It)=>{switch(r.op){case"BatchMatMul":case"BatchMatMulV2":case"MatMul":return[o.matMul(C("a",r,t,e),C("b",r,t,e),C("transposeA",r,t,e),C("transposeB",r,t,e))];case"Einsum":return[o.einsum(C("equation",r,t,e),...C("tensors",r,t,e))];case"Transpose":return[o.transpose(C("x",r,t,e),C("perm",r,t,e))];case"_FusedMatMul":let[n,s]=C("fusedOps",r,t,e),a=n==="biasadd",i=s==="prelu",c=C("numArgs",r,t,e),p=C("leakyreluAlpha",r,t,e);if(a){if(i&&c!==2)throw new Error("Fused MatMul with BiasAdd and Prelu must have two extra arguments: bias and alpha.");if(!i&&c!==1)throw new Error("Fused MatMul with BiasAdd must have one extra argument: bias.")}let[l,u]=C("args",r,t,e);return[o.fused.matMul({a:C("a",r,t,e),b:C("b",r,t,e),transposeA:C("transposeA",r,t,e),transposeB:C("transposeB",r,t,e),bias:l,activation:s,preluActivationWeights:u,leakyreluAlpha:p})];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Lk=(r,t,e,o=It)=>{switch(r.op){case"EuclideanNorm":return[o.euclideanNorm(C("x",r,t,e),C("axis",r,t,e),C("keepDims",r,t,e))];case"FusedBatchNorm":case"FusedBatchNormV2":return[o.batchNorm(C("x",r,t,e),C("mean",r,t,e),C("variance",r,t,e),C("offset",r,t,e),C("scale",r,t,e),C("epsilon",r,t,e))];case"FusedBatchNormV3":return[o.batchNorm(C("x",r,t,e),C("mean",r,t,e),C("variance",r,t,e),C("offset",r,t,e),C("scale",r,t,e),C("epsilon",r,t,e))];case"LRN":return[o.localResponseNormalization(C("x",r,t,e),C("radius",r,t,e),C("bias",r,t,e),C("alpha",r,t,e),C("beta",r,t,e))];case"Softmax":return[o.softmax(C("x",r,t,e))];case"LogSoftmax":return[o.logSoftmax(C("x",r,t,e))];case"SparseToDense":return[o.sparseToDense(C("sparseIndices",r,t,e),C("outputShape",r,t,e),C("sparseValues",r,t,e),C("defaultValue",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Bk=(r,t,e,o=It)=>{switch(r.op){case"Max":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.max(C("x",r,t,e),i,c)]}case"Mean":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.mean(C("x",r,t,e),i,c)]}case"Min":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.min(C("x",r,t,e),i,c)]}case"Sum":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.sum(C("x",r,t,e),i,c)]}case"All":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.all(C("x",r,t,e),i,c)]}case"Any":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.any(C("x",r,t,e),i,c)]}case"ArgMax":{let i=C("axis",r,t,e);return[o.argMax(C("x",r,t,e),i)]}case"ArgMin":{let i=C("axis",r,t,e);return[o.argMin(C("x",r,t,e),i)]}case"Prod":{let i=C("axis",r,t,e),c=C("keepDims",r,t,e);return[o.prod(C("x",r,t,e),i,c)]}case"Cumprod":{let i=C("axis",r,t,e),c=C("exclusive",r,t,e),p=C("reverse",r,t,e);return[o.cumprod(C("x",r,t,e),i,c,p)]}case"Cumsum":{let i=C("axis",r,t,e),c=C("exclusive",r,t,e),p=C("reverse",r,t,e);return[o.cumsum(C("x",r,t,e),i,c,p)]}case"Bincount":let n=C("x",r,t,e),s=C("weights",r,t,e),a=C("size",r,t,e);return[o.bincount(n,s,a)];case"DenseBincount":{let i=C("x",r,t,e),c=C("weights",r,t,e),p=C("size",r,t,e),l=C("binaryOutput",r,t,e);return[o.denseBincount(i,c,p,l)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Vk=(r,t,e,o=It)=>{switch(r.op){case"ConcatV2":case"Concat":{let n=C("n",r,t,e),s=C("axis",r,t,e),a=C("tensors",r,t,e);return a=a.slice(0,n),[o.concat(a,s)]}case"Gather":{let n=C("x",r,t,e),s=C("indices",r,t,e);return[o.gather(n,o.cast(s,"int32"),0)]}case"GatherV2":{let n=C("axis",r,t,e),s=C("batchDims",r,t,e),a=C("x",r,t,e),i=C("indices",r,t,e);return[o.gather(a,o.cast(i,"int32"),n,s)]}case"Reverse":{let n=C("dims",r,t,e),s=[];for(let i=0;i<n.length;i++)n[i]&&s.push(i);let a=C("x",r,t,e);return[o.reverse(a,s)]}case"ReverseV2":{let n=C("axis",r,t,e),s=C("x",r,t,e);return[o.reverse(s,n)]}case"Slice":{let n=C("begin",r,t,e),s=C("size",r,t,e);return[o.slice(C("x",r,t,e),n,s)]}case"StridedSlice":{let n=C("begin",r,t,e),s=C("end",r,t,e),a=C("strides",r,t,e),i=C("beginMask",r,t,e),c=C("endMask",r,t,e),p=C("ellipsisMask",r,t,e),l=C("newAxisMask",r,t,e),u=C("shrinkAxisMask",r,t,e),m=C("x",r,t,e);return[o.stridedSlice(m,n,s,a,i,c,p,l,u)]}case"Pack":return Jt(()=>{let n=C("axis",r,t,e),s=C("tensors",r,t,e),a=s[0].shape,i=o.squeeze(s[0]).shape,c=s.map(p=>{let l=y.arraysEqual(p.shape,a);if(!l&&!y.arraysEqual(o.squeeze(p).shape,i))throw new Error("the input tensors shape does not match");return l?p:o.reshape(p,a)});return[o.stack(c,n)]});case"Unpack":{let n=C("axis",r,t,e),s=C("tensor",r,t,e);return o.unstack(s,n)}case"Tile":{let n=C("reps",r,t,e);return[o.tile(C("x",r,t,e),n)]}case"Split":case"SplitV":{let n=C("axis",r,t,e),s=C("numOrSizeSplits",r,t,e),a=C("x",r,t,e);return o.split(a,s,n)}case"ScatterNd":{let n=C("indices",r,t,e),s=C("values",r,t,e),a=C("shape",r,t,e);return[o.scatterND(n,s,a)]}case"GatherNd":{let n=C("x",r,t,e),s=C("indices",r,t,e);return[o.gatherND(n,s)]}case"SparseToDense":{let n=C("sparseIndices",r,t,e),s=C("outputShape",r,t,e),a=C("sparseValues",r,t,e),i=C("defaultValue",r,t,e);return[o.sparseToDense(n,a,s,a.dtype===i.dtype?i:o.cast(i,a.dtype))]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Mk=(r,t,e,o=It)=>{switch(r.op){case"SparseFillEmptyRows":{let{outputIndices:n,outputValues:s,emptyRowIndicator:a,reverseIndexMap:i}=o.sparse.sparseFillEmptyRows(C("indices",r,t,e),C("values",r,t,e),C("denseShape",r,t,e),C("defaultValue",r,t,e));return[n,s,a,i]}case"SparseReshape":{let{outputIndices:n,outputShape:s}=o.sparse.sparseReshape(C("inputIndices",r,t,e),C("inputShape",r,t,e),C("newShape",r,t,e));return[n,s]}case"SparseSegmentMean":return[o.sparse.sparseSegmentMean(C("data",r,t,e),C("indices",r,t,e),C("segmentIds",r,t,e))];case"SparseSegmentSum":return[o.sparse.sparseSegmentSum(C("data",r,t,e),C("indices",r,t,e),C("segmentIds",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var zk=(r,t,e,o=It)=>{switch(r.op){case"FFT":return[o.fft(C("x",r,t,e))];case"IFFT":return[o.ifft(C("x",r,t,e))];case"RFFT":return[o.rfft(C("x",r,t,e))];case"IRFFT":return[o.irfft(C("x",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Wk=(r,t,e,o=It)=>{switch(r.op){case"StringNGrams":{let{nGrams:n,nGramsSplits:s}=o.string.stringNGrams(C("data",r,t,e),C("dataSplits",r,t,e),C("separator",r,t,e),C("nGramWidths",r,t,e),C("leftPad",r,t,e),C("rightPad",r,t,e),C("padWidth",r,t,e),C("preserveShortSequences",r,t,e));return[n,s]}case"StringSplit":{let{indices:n,values:s,shape:a}=o.string.stringSplit(C("input",r,t,e),C("delimiter",r,t,e),C("skipEmpty",r,t,e));return[n,s,a]}case"StringToHashBucketFast":return[o.string.stringToHashBucketFast(C("input",r,t,e),C("numBuckets",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var Gk=(r,t,e,o=It)=>{switch(r.op){case"Cast":return[o.cast(C("x",r,t,e),C("dtype",r,t,e))];case"ExpandDims":{let n=C("axis",r,t,e);return[o.expandDims(C("x",r,t,e),n)]}case"Squeeze":{let n=C("axis",r,t,e);return[o.squeeze(C("x",r,t,e),n)]}case"Reshape":return[o.reshape(C("x",r,t,e),C("shape",r,t,e))];case"MirrorPad":return[o.mirrorPad(C("x",r,t,e),C("padding",r,t,e),C("mode",r,t,e))];case"PadV2":case"Pad":return[o.pad(C("x",r,t,e),C("padding",r,t,e),C("constantValue",r,t,e))];case"SpaceToBatchND":{let n=C("blockShape",r,t,e),s=C("paddings",r,t,e);return[o.spaceToBatchND(C("x",r,t,e),n,s)]}case"BatchToSpaceND":{let n=C("blockShape",r,t,e),s=C("crops",r,t,e);return[o.batchToSpaceND(C("x",r,t,e),n,s)]}case"DepthToSpace":{let n=C("blockSize",r,t,e),s=C("dataFormat",r,t,e).toUpperCase();return[o.depthToSpace(C("x",r,t,e),n,s)]}case"BroadcastTo":return[o.broadcastTo(C("x",r,t,e),C("shape",r,t,e))];case"BroadcastArgs":return[o.broadcastArgs(C("s0",r,t,e),C("s1",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function qh(r,t,e,o,n=Jt){let s=((a,i,c)=>{switch(a.category){case"arithmetic":return n(()=>bk(a,i,c));case"basic_math":return n(()=>Ck(a,i,c));case"control":return vk(a,i,c);case"convolution":return n(()=>Ek(a,i,c));case"creation":return n(()=>$k(a,i,c));case"dynamic":return Rk(a,i,c);case"evaluation":return n(()=>Ak(a,i,c));case"image":return n(()=>_k(a,i,c));case"graph":return n(()=>Fk(a,i,c));case"logical":return n(()=>Ok(a,i,c));case"matrices":return n(()=>Pk(a,i,c));case"normalization":return n(()=>Lk(a,i,c));case"reduction":return n(()=>Bk(a,i,c));case"slice_join":return n(()=>Vk(a,i,c));case"sparse":return n(()=>Mk(a,i,c));case"spectral":return n(()=>zk(a,i,c));case"string":return n(()=>Wk(a,i,c));case"transformation":return n(()=>Gk(a,i,c));case"hash_table":return Dk(a,i,c,o);case"custom":let p=Nm(a.op);if(p&&p.customExecutor)return p.customExecutor(new Pm(a,i,c));throw TypeError(`Custom op ${a.op} is not registered.`);default:throw TypeError(`Unknown op '${a.op}'. File an issue at https://github.com/tensorflow/tfjs/issues so we can add it, or register a custom execution with tf.registerOp()`)}})(r,t,e);return y.isPromise(s)?s.then(a=>[].concat(a)):[].concat(s)}var Oc=class{constructor(t={},e={},o={},n={}){this.weightMap=t,this.tensorArrayMap=e,this.tensorListMap=o,this.functionMap=n,this.rootContext={id:0,frameName:"",iterationId:0},this.contexts=[this.rootContext],this.lastId=0,this.generateCurrentContextIds()}newFrame(t,e){return{id:t,frameName:e,iterationId:0}}set currentContext(t){this.contexts!==t&&(this.contexts=t,this.generateCurrentContextIds())}get currentContext(){return this.contexts}get currentContextId(){return this._currentContextIds[0]}get currentContextIds(){return this._currentContextIds}generateCurrentContextIds(){let t=[];for(let e=0;e<this.contexts.length-1;e++){let o=this.contexts.slice(0,this.contexts.length-e);t.push(this.contextIdforContexts(o))}t.push(""),this._currentContextIds=t}contextIdforContexts(t){return t?t.map(e=>e.id===0&&e.iterationId===0?"":`${e.frameName}-${e.iterationId}`).join("/"):""}enterFrame(t){this.contexts&&(this.lastId++,this.contexts=this.contexts.slice(),this.contexts.push(this.newFrame(this.lastId,t)),this._currentContextIds.unshift(this.contextIdforContexts(this.contexts)))}exitFrame(){if(this.contexts&&this.contexts.length>1)this.contexts=this.contexts.slice(),this.contexts.splice(-1),this.currentContextIds.shift();else throw new Error("Cannot exit frame, the context is empty")}nextIteration(){if(this.contexts&&this.contexts.length>0){this.contexts=this.contexts.slice(),this.lastId++;let t=Object.assign({},this.contexts[this.contexts.length-1]);t.iterationId+=1,t.id=this.lastId,this.contexts.splice(-1,1,t),this._currentContextIds.splice(0,1,this.contextIdforContexts(this.contexts))}else throw new Error("Cannot increase frame iteration, the context is empty")}getWeight(t){return this.weightMap[t]}addTensorArray(t){this.tensorArrayMap[t.id]=t}getTensorArray(t){return this.tensorArrayMap[t]}addTensorList(t){this.tensorListMap[t.id]=t}getTensorList(t){return this.tensorListMap[t]}dispose(t){for(let e in this.tensorArrayMap)this.tensorArrayMap[e].clearAndClose(t);for(let e in this.tensorListMap)this.tensorListMap[e].clearAndClose(t)}};function Xh(r,t,e,o){let n=new Set,s=[],a=null,i=null,c=new Set,p=Object.keys(r).map(m=>Se(m)[0]),l=[];o!=null&&(l=o.map(m=>Se(m.name)[0]));let u=[...t];for(;u.length>0;){let m=u.pop();if((jh(m)||H4(m)||K4(m))&&a==null&&(a=m,i=a.children.map(f=>f.name).filter(f=>n.has(f))),n.add(m.name),e[m.name]==null&&p.indexOf(m.name)===-1&&l.indexOf(m.name)===-1){if(m.inputs.length===0){s.push(m.name);continue}m.inputs.forEach(f=>{c.has(f.name)||(c.add(f.name),u.push(f))})}}return{inputs:r,outputs:t,usedNodes:n,missingInputs:s,dynamicNode:a,syncInputs:i}}function Uk(r,t,e){let{usedNodes:o,inputs:n}=e,s=[],a=Object.keys(n).map(l=>Se(l)[0]).map(l=>r.nodes[l]),i=r.initNodes;a.forEach(l=>{o.has(l.name)&&s.push(l)}),r.weights.forEach(l=>{o.has(l.name)&&s.push(l)}),i?.forEach(l=>{o.has(l.name)&&s.push(l)});let c=new Set,p=[];for(;s.length>0;){let l=s.pop();c.add(l.name),t[l.name]||p.push(l),l.children.forEach(u=>{!c.has(u.name)&&o.has(u.name)&&u.inputs.every(m=>c.has(m.name))&&s.push(u)})}return p}var W4=["Switch","Merge","Enter","Exit","NextIteration","StatelessIf","StatelessWhile","if","While"],G4=["NonMaxSuppressionV2","NonMaxSuppressionV3","NonMaxSuppressionV5","Where"],U4=["HashTable","HashTableV2","LookupTableImport","LookupTableImportV2","LookupTableFind","LookupTableFindV2","LookupTableSize","LookupTableSizeV2"];function jh(r){return W4.indexOf(r.op)>=0}function H4(r){return G4.indexOf(r.op)>=0}function K4(r){return U4.indexOf(r.op)>=0}var Pc=class r{constructor(t,e){this.graph=t,this.parent=e,this.compiledMap=new Map,this._weightMap={},this.SEPERATOR=",",this._functions={},this._functionExecutorMap={},this.intermediateTensors={},this.keepTensorForDebug=!1,this._outputs=t.outputs,this._inputs=t.inputs,this._initNodes=t.initNodes,this._signature=t.signature,this._functions=t.functions,t.functions!=null&&Object.keys(t.functions).forEach(o=>{this._functionExecutorMap[o]=new r(t.functions[o],this)})}get weightIds(){return this.parent?this.parent.weightIds:this._weightIds}get functionExecutorMap(){return this.parent?this.parent.functionExecutorMap:this._functionExecutorMap}get weightMap(){return this.parent?this.parent.weightMap:this._weightMap}set weightMap(t){let e=Object.keys(t).map(o=>t[o].map(n=>n.id));this._weightIds=[].concat(...e),this._weightMap=t}set resourceManager(t){this._resourceManager=t}get inputs(){return this._inputs.map(t=>({name:t.name,shape:t.attrParams.shape?t.attrParams.shape.value:void 0,dtype:t.attrParams.dtype?t.attrParams.dtype.value:void 0}))}get outputs(){return this._outputs.map(t=>({name:t.name,shape:t.attrParams.shape?t.attrParams.shape.value:void 0,dtype:t.attrParams.dtype?t.attrParams.dtype.value:void 0}))}get inputNodes(){return this._inputs.map(t=>t.signatureKey||t.name)}get outputNodes(){return this._outputs.map(t=>{let e=t.signatureKey||t.name;return t.defaultOutput?`${e}:${t.defaultOutput}`:e})}get functions(){return Object.keys(this._functions).reduce((t,e)=>(t[e]=this._functions[e].signature,t),{})}getCompilationKey(t,e){let o=t.map(s=>s.name).sort(),n=e.map(s=>s.name).sort();return o.join(this.SEPERATOR)+"--"+n.join(this.SEPERATOR)}compile(t,e){let o=Xh(t,e,this.weightMap,this._initNodes),{missingInputs:n,dynamicNode:s,syncInputs:a}=o;if(s!=null)throw new Error(`This execution contains the node '${s.name}', which has the dynamic op '${s.op}'. Please use model.executeAsync() instead. Alternatively, to avoid the dynamic ops, specify the inputs [${a}]`);if(n.length>0){let i=e.map(p=>p.name),c=Object.keys(t);throw new Error(`Cannot compute the outputs [${i}] from the provided inputs [${c}]. Missing the following inputs: [${n}]`)}return Uk(this.graph,this.weightMap,o)}execute(t,e){t=this.mapInputs(t);let o=Object.keys(t).sort();this.checkInputs(t),this.checkInputShapeAndType(t),e=this.mapOutputs(e),this.checkOutputs(e);let n=o.map(u=>this.graph.nodes[Se(u)[0]]),s=e.map(u=>Se(u)[0]),a=s.map(u=>this.graph.nodes[u]);this.resetIntermediateTensors(),a.length===0&&(a=this._outputs);let i=this.getCompilationKey(n,a),c=this.compiledMap.get(i);c==null&&(c=this.compile(t,a),this.compiledMap.set(i,c));let p={},l={};return Jt(()=>{let u=new Oc(this.weightMap,p,l,this.functionExecutorMap),m=Object.assign({},this.weightMap);Object.keys(t).forEach(h=>{let[g,x]=Se(h),b=[];b[x]=t[h],m[g]=b});let f=this.getFrozenTensorIds(m),d={};for(let h=0;h<c.length;h++){let g=c[h];if(!m[g.name]){let x=qh(g,m,u,this._resourceManager);if(y.isPromise(x))throw new Error(`The execution of the op '${g.op}' returned a promise. Please use model.executeAsync() instead.`);m[g.name]=x,this.checkTensorForDisposal(g.name,g,m,u,f,s,d)}}return this.parent==null&&u.dispose(f),e.map(h=>re(h,m,u))})}getFrozenTensorIds(t){let e=[].concat.apply([],Object.keys(t).map(o=>t[o]).map(o=>o.map(n=>n.id)));return new Set(e)}checkTensorForDisposal(t,e,o,n,s,a,i){e.category==="control"||a.indexOf(t)!==-1||(o[t].forEach(c=>{c!=null&&(i[c.id]=(i[c.id]||0)+e.children.length)}),e.inputs.forEach(c=>{if(c.category!=="control"){let p=hk(c.name,o,n);p?.forEach(l=>{if(l&&!l.kept&&!s.has(l.id)){let u=i[l.id];if(u===1){if(!this.keepTensorForDebug)l.dispose();else{let[m,f]=sr(e.name,n);this.intermediateTensors[m]?this.intermediateTensors[m][f]=l:(this.intermediateTensors[m]=[],this.intermediateTensors[m][f]=l)}delete i[l.id]}else u!=null&&i[l.id]--}})}}))}async executeAsync(t,e){return this._executeAsync(t,e)}disposeIntermediateTensors(){this.intermediateTensors&&(Object.keys(this.intermediateTensors).forEach(t=>this.intermediateTensors[t].forEach(e=>e.dispose())),this.disposeTensorsMap())}disposeTensorsMap(){this.tensorsMap&&Object.keys(this.tensorsMap).forEach(t=>{this.tensorsMap[t].forEach(o=>{o&&!o.kept&&!o.isDisposed&&!this.keepIds.has(o.id)&&o.dispose()})})}getIntermediateTensors(){return this.tensorsMap}resetIntermediateTensors(){for(let t in this.intermediateTensors)this.intermediateTensors[t].forEach(e=>e.dispose()),delete this.intermediateTensors[t]}async _executeAsync(t,e,o=!1,n={},s={}){o||(t=this.mapInputs(t),this.checkInputs(t),this.checkInputShapeAndType(t),e=this.mapOutputs(e),this.checkOutputs(e));try{this.keepTensorForDebug=F().getBool("KEEP_INTERMEDIATE_TENSORS")}catch(l){console.warn(l.message)}this.resetIntermediateTensors();let a=new Oc(this.weightMap,n,s,this.functionExecutorMap);this.tensorsMap=await this.executeWithControlFlow(t,a,e,o);let i=e.map(l=>re(l,this.tensorsMap,a)),c=i.map(l=>l.id),p=Object.keys(t).map(l=>t[l].id);return this.keepIds=new Set([...c,...p,...this.weightIds]),this.keepTensorForDebug||this.disposeTensorsMap(),this.parent==null&&a.dispose(this.keepIds),i}async executeFunctionAsync(t,e,o){let n=t.reduce((s,a,i)=>(s[this.inputs[i].name]=a,s),{});return this._executeAsync(n,this.outputNodes,!0,e,o)}async executeWithControlFlow(t,e,o,n){let s=Object.keys(t),a=s.map(S=>this.graph.nodes[Se(S)[0]]),i=o.map(S=>Se(S)[0]),c=i.map(S=>this.graph.nodes[S]);c.length===0&&(c=this._outputs);let{usedNodes:p,missingInputs:l,dynamicNode:u,syncInputs:m}=Xh(t,c,this.weightMap,this._initNodes),f=[...a,...this.graph.weights,...this._initNodes||[]].map(S=>({node:S,contexts:e.currentContext})),d=Object.assign({},this.weightMap);Object.keys(t).forEach(S=>{let[N,k]=Se(S),$=[];$[k]=t[S],d[N]=$});let h={},g=this.getFrozenTensorIds(d),x={};for(;f.length>0;){let S=this.processStack(a,f,e,d,x,g,i,h,p);await Promise.all(S)}u==null&&!n&&console.warn("This model execution did not contain any nodes with control flow or dynamic output shapes. You can use model.execute() instead.");let b=c.filter(S=>!jh(S)&&!re(S.name,d,e)).map(S=>S.name);if(b.length>0){let S="";throw u!=null&&(S=`Alternatively, to avoid the dynamic ops, use model.execute() and specify the inputs [${m}]`),new Error(`Cannot compute the outputs [${b}] from the provided inputs [${s}]. Consider providing the following inputs: [${l}]. ${S}`)}return d}processStack(t,e,o,n,s,a,i,c,p){let l=[];for(;e.length>0;){let u=e.pop();o.currentContext=u.contexts;let m="";if(u.node.op==="Enter"&&C("isConstant",u.node,n,o)&&([m]=sr(u.node.name,o)),n[u.node.name]==null){let f=qh(u.node,n,o,this._resourceManager);m||([m]=sr(u.node.name,o));let d=o.currentContext;y.isPromise(f)?l.push(f.then(h=>(n[m]=h,o.currentContext=d,this.checkTensorForDisposal(m,u.node,n,o,a,i,c),this.processChildNodes(u.node,e,o,n,s,p),h))):(n[m]=f,this.checkTensorForDisposal(m,u.node,n,o,a,i,c),this.processChildNodes(u.node,e,o,n,s,p))}else this.processChildNodes(u.node,e,o,n,s,p)}return l}processChildNodes(t,e,o,n,s,a){t.children.forEach(i=>{let[c]=sr(i.name,o);s[c]||!a.has(i.name)||(i.op==="Merge"?i.inputNames.some(p=>!!re(p,n,o))&&(s[c]=!0,e.push({contexts:o.currentContext,node:i})):i.inputNames.every(p=>!!re(p,n,o))&&(s[c]=!0,e.push({contexts:o.currentContext,node:i})))})}dispose(){Object.keys(this.weightMap).forEach(t=>this.weightMap[t].forEach(e=>e.dispose()))}checkInputShapeAndType(t){Object.keys(t).forEach(e=>{let o=t[e],[n]=Se(e),s=this.graph.nodes[n];if(s.attrParams.shape&&s.attrParams.shape.value){let a=s.attrParams.shape.value,i=a.length===o.shape.length&&o.shape.every((c,p)=>a[p]===-1||a[p]===c);y.assert(i,()=>`The shape of dict['${s.name}'] provided in model.execute(dict) must be [${a}], but was [${o.shape}]`)}s.attrParams.dtype&&s.attrParams.dtype.value&&y.assert(o.dtype===s.attrParams.dtype.value,()=>`The dtype of dict['${s.name}'] provided in model.execute(dict) must be ${s.attrParams.dtype.value}, but was ${o.dtype}`)})}mapInputs(t){let e={};for(let o in t)if(this._signature!=null&&this._signature.inputs!=null&&this._signature.inputs[o]!=null){let n=this._signature.inputs[o];e[n.name]=t[o]}else e[o]=t[o];return e}checkInputs(t){let e=Object.keys(t).filter(o=>{let[n]=Se(o);return this.graph.nodes[n]==null});if(e.length>0)throw new Error(`The dict provided in model.execute(dict) has keys: [${e}] that are not part of graph`)}mapOutputs(t){return t.map(e=>this._signature!=null&&this._signature.outputs!=null&&this._signature.outputs[e]!=null?this._signature.outputs[e].name:e,{})}checkOutputs(t){t.forEach(e=>{let[o]=Se(e);if(!this.graph.nodes[o])throw new Error(`The output '${e}' is not found in the graph`)})}};var Mm=class{constructor(t={},e={}){this.hashTableNameToHandle=t,this.hashTableMap=e}addHashTable(t,e){this.hashTableNameToHandle[t]=e.handle,this.hashTableMap[e.id]=e}getHashTableHandleByName(t){return this.hashTableNameToHandle[t]}getHashTableById(t){return this.hashTableMap[t]}dispose(){for(let t in this.hashTableMap)this.hashTableMap[t].clearAndClose(),delete this.hashTableMap[t];for(let t in this.hashTableNameToHandle)this.hashTableNameToHandle[t].dispose(),delete this.hashTableNameToHandle[t]}};var q4="?tfjs-format=file",X4="model.json",zm=class{constructor(t,e={},o=ji){this.modelUrl=t,this.loadOptions=e,this.version="n/a",this.io=o,e==null&&(this.loadOptions={}),this.resourceManager=new Mm}get modelVersion(){return this.version}get inputNodes(){return this.executor.inputNodes}get outputNodes(){return this.executor.outputNodes}get inputs(){return this.executor.inputs}get outputs(){return this.executor.outputs}get weights(){return this.executor.weightMap}get metadata(){return this.artifacts.userDefinedMetadata}get modelSignature(){return this.signature}get modelStructuredOutputKeys(){return this.structuredOutputKeys}findIOHandler(){let t=this.modelUrl;if(t.load!=null)this.handler=t;else if(this.loadOptions.requestInit!=null)this.handler=this.io.browserHTTPRequest(t,this.loadOptions);else{let e=this.io.getLoadHandlers(t,this.loadOptions);if(e.length===0)e.push(this.io.browserHTTPRequest(t,this.loadOptions));else if(e.length>1)throw new Error(`Found more than one (${e.length}) load handlers for URL '${[t]}'`);this.handler=e[0]}}load(){if(this.findIOHandler(),this.handler.load==null)throw new Error("Cannot proceed with model loading because the IOHandler provided does not have the `load` method implemented.");let t=this.handler.load();return y.isPromise(t)?t.then(e=>this.loadSync(e)):this.loadSync(t)}loadSync(t){this.artifacts=t;let e=this.artifacts.modelTopology,o=this.artifacts.signature;if(this.artifacts.userDefinedMetadata!=null){let s=this.artifacts.userDefinedMetadata;s.signature!=null&&(o=s.signature),s.structuredOutputKeys!=null&&(this.structuredOutputKeys=s.structuredOutputKeys)}this.signature=o,this.version=`${e.versions.producer}.${e.versions.minConsumer}`;let n=this.io.decodeWeights(this.artifacts.weightData,this.artifacts.weightSpecs);if(this.executor=new Pc(_c.Instance.transformGraph(e,this.signature)),this.executor.weightMap=this.convertTensorMapToTensorsMap(n),this.executor.resourceManager=this.resourceManager,t.modelInitializer!=null&&t.modelInitializer.node!=null){let s=_c.Instance.transformGraph(t.modelInitializer);this.initializer=new Pc(s),this.initializer.weightMap=this.executor.weightMap,this.initializer.resourceManager=this.resourceManager,this.initializer.executeAsync({},[])}return!0}async save(t,e){if(typeof t=="string"){let o=this.io.getSaveHandlers(t);if(o.length===0)throw new Error(`Cannot find any save handlers for URL '${t}'`);if(o.length>1)throw new Error(`Found more than one (${o.length}) save handlers for URL '${t}'`);t=o[0]}if(t.save==null)throw new Error("GraphModel.save() cannot proceed because the IOHandler provided does not have the `save` attribute defined.");return t.save(this.artifacts)}predict(t,e){let o=this.execute(t,this.outputNodes);if(this.structuredOutputKeys){let n=o instanceof Lt?[o]:o,s={};return n.forEach((a,i)=>s[this.structuredOutputKeys[i]]=a),s}return o}normalizeInputs(t){if(!(t instanceof Lt)&&!Array.isArray(t))return t;if(t=Array.isArray(t)?t:[t],t.length!==this.inputNodes.length)throw new Error(`Input tensor count mismatch,the graph model has ${this.inputNodes.length} placeholders, while there are ${t.length} input tensors.`);return this.inputNodes.reduce((e,o,n)=>(e[o]=t[n],e),{})}normalizeOutputs(t){return t=t||this.outputNodes,Array.isArray(t)?t:[t]}execute(t,e){t=this.normalizeInputs(t),e=this.normalizeOutputs(e);let o=this.executor.execute(t,e);return o.length>1?o:o[0]}async executeAsync(t,e){t=this.normalizeInputs(t),e=this.normalizeOutputs(e);let o=await this.executor.executeAsync(t,e);return o.length>1?o:o[0]}getIntermediateTensors(){return this.executor.getIntermediateTensors()}disposeIntermediateTensors(){this.executor.disposeIntermediateTensors()}convertTensorMapToTensorsMap(t){return Object.keys(t).reduce((e,o)=>(e[o]=[t[o]],e),{})}dispose(){this.executor.dispose(),this.initializer&&this.initializer.dispose(),this.resourceManager.dispose()}};async function Hk(r,t={},e=ji){if(r==null)throw new Error("modelUrl in loadGraphModel() cannot be null. Please provide a url or an IOHandler that loads the model");t==null&&(t={}),t.fromTFHub&&typeof r=="string"&&(r=j4(r));let o=new zm(r,t,e);return await o.load(),o}function j4(r){return r.endsWith("/")||(r=r+"/"),`${r}${X4}${q4}`}export{Bf as dispose,lr as engine,F as env,S$ as getBackend,Hk as loadGraphModel,b$ as memory,T$ as ready,C$ as setBackend,me as tensor};
