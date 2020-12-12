// Created by iWeb 3.0.2 local-build-20101008

function createMediaStream_id5()
{return IWCreatePhotocast("http://www.katefriedman.com/site_10.8.10/Resume2_files/rss.xml",true);}
function initializeMediaStream_id5()
{createMediaStream_id5().load('http://www.katefriedman.com/site_10.8.10',function(imageStream)
{var entryCount=imageStream.length;var headerView=widgets['widget0'];headerView.setPreferenceForKey(imageStream.length,'entryCount');NotificationCenter.postNotification(new IWNotification('SetPage','id5',{pageIndex:0}));});}
function layoutMediaGrid_id5(range)
{createMediaStream_id5().load('http://www.katefriedman.com/site_10.8.10',function(imageStream)
{if(range==null)
{range=new IWRange(0,imageStream.length);}
IWLayoutPhotoGrid('id5',new IWPhotoGridLayout(3,new IWSize(253,253),new IWSize(253,75),new IWSize(296,343),27,27,0,new IWSize(0,0)),new IWEmptyStroke(),imageStream,range,new IWShadow({blurRadius:4,offset:new IWPoint(3.5355,3.5355),color:'#000000',opacity:0.500000}),null,1.000000,{backgroundColor:'rgb(0, 0, 0)',reflectionHeight:100,reflectionOffset:2,captionHeight:100,fullScreen:0,transitionIndex:2},'Media/slideshow.html','widget0','widget1','widget2')});}
function relayoutMediaGrid_id5(notification)
{var userInfo=notification.userInfo();var range=userInfo['range'];layoutMediaGrid_id5(range);}
function onStubPage()
{var args=window.location.href.toQueryParams();parent.IWMediaStreamPhotoPageSetMediaStream(createMediaStream_id5(),args.id);}
if(window.stubPage)
{onStubPage();}
setTransparentGifURL('Media/transparent.gif');function applyEffects()
{var registry=IWCreateEffectRegistry();registry.registerEffects({stroke_0:new IWStrokeParts([{rect:new IWRect(-1,1,2,28),url:'Resume2_files/stroke.png'},{rect:new IWRect(-1,-1,2,2),url:'Resume2_files/stroke_1.png'},{rect:new IWRect(1,-1,960,2),url:'Resume2_files/stroke_2.png'},{rect:new IWRect(961,-1,2,2),url:'Resume2_files/stroke_3.png'},{rect:new IWRect(961,1,2,28),url:'Resume2_files/stroke_4.png'},{rect:new IWRect(961,29,2,2),url:'Resume2_files/stroke_5.png'},{rect:new IWRect(1,29,960,2),url:'Resume2_files/stroke_6.png'},{rect:new IWRect(-1,29,2,2),url:'Resume2_files/stroke_7.png'}],new IWSize(962,30))});registry.applyEffects();}
function hostedOnDM()
{return false;}
function onPageLoad()
{IWRegisterNamedImage('comment overlay','Media/Photo-Overlay-Comment.png')
IWRegisterNamedImage('movie overlay','Media/Photo-Overlay-Movie.png')
loadMozillaCSS('Resume2_files/Resume2Moz.css')
adjustLineHeightIfTooBig('id1');adjustFontSizeIfTooBig('id1');adjustLineHeightIfTooBig('id2');adjustFontSizeIfTooBig('id2');adjustLineHeightIfTooBig('id3');adjustFontSizeIfTooBig('id3');adjustLineHeightIfTooBig('id4');adjustFontSizeIfTooBig('id4');NotificationCenter.addObserver(null,relayoutMediaGrid_id5,'RangeChanged','id5')
adjustLineHeightIfTooBig('id6');adjustFontSizeIfTooBig('id6');adjustLineHeightIfTooBig('id7');adjustFontSizeIfTooBig('id7');adjustLineHeightIfTooBig('id8');adjustFontSizeIfTooBig('id8');adjustLineHeightIfTooBig('id9');adjustFontSizeIfTooBig('id9');adjustLineHeightIfTooBig('id10');adjustFontSizeIfTooBig('id10');fixAllIEPNGs('Media/transparent.gif');Widget.onload();applyEffects()
initializeMediaStream_id5()}
function onPageUnload()
{Widget.onunload();}
