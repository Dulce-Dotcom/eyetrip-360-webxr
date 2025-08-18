// VRButton.js - copied from Three.js examples/jsm/webxr/VRButton.js
// Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/webxr/VRButton.js

export const VRButton = {
	createButton: function ( renderer ) {
		const button = document.createElement( 'button' );
		function showEnterVR( device ) {
			let currentSession = null;
			async function onSessionStarted( session ) {
				session.addEventListener( 'end', onSessionEnded );
				await renderer.xr.setSession( session );
				button.textContent = 'EXIT VR';
				currentSession = session;
			}
			function onSessionEnded( /*event*/ ) {
				currentSession.removeEventListener( 'end', onSessionEnded );
				button.textContent = 'ENTER VR';
				currentSession = null;
			}
			button.style.display = '';
			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';
			button.textContent = 'ENTER VR';
			button.onmouseenter = function () {
				button.style.opacity = '1.0';
			};
			button.onmouseleave = function () {
				button.style.opacity = '0.5';
			};
			button.onclick = function () {
				if ( currentSession === null ) {
					const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor' ] };
					navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );
				} else {
					currentSession.end();
				}
			};
		}
		function disableButton() {
			button.style.display = '';
			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';
			button.onmouseenter = null;
			button.onmouseleave = null;
			button.onclick = null;
		}
		function showWebXRNotFound() {
			button.style.display = '';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';
			button.textContent = 'VR NOT SUPPORTED';
		}
		if ( 'xr' in navigator ) {
			button.id = 'VRButton';
			button.style.display = 'none';
			navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( supported ) {
				supported ? showEnterVR() : showWebXRNotFound();
			} );
			document.body.appendChild( button );
		} else {
			const message = document.createElement( 'a' );
			if ( window.isSecureContext === false ) {
				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS';
			} else {
				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';
			}
			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';
			message.style.position = 'absolute';
			message.style.bottom = '20px';
			message.style.padding = '12px 6px';
			message.style.border = '1px solid #fff';
			message.style.borderRadius = '4px';
			message.style.color = '#fff';
			message.style.background = 'rgba(0,0,0,0.1)';
			message.style.textAlign = 'center';
			message.style.opacity = '0.5';
			document.body.appendChild( message );
		}
		return button;
	}
};
