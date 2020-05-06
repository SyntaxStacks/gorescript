GS.OnlinePlayerStates = {
	Scripted: 0,
	Inactive: 1,
	Awake: 2,
	Active: 3,
};

GS.OnlinePlayer = function(grid, layer, sourceObj) {
	GS.GridObject.apply(this, arguments);

	this.monsterType = "nom";
	$.extend(true, this, GS.Monsters[this.monsterType]);

  this.id = sourceObj.id;
	this.xAngle = THREE.Math.degToRad(360 - sourceObj.rotation);
	this.direction = new THREE.Vector3();

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
			boundingSquare: new THREE.Box2(),
			ellipsoid: this.size,
			triangles: null,
		}
	};

	this.dead = false;
	this.health = this.maxHealth;
	this.scatterCooldown = 0;
	this.state = GS.OnlinePlayerStates.Active;
	this.moving = false;
	this.inPain = false;

	this.changeTargetMaxCooldown = GS.msToFrames(500);
	this.changeTargetCooldown = 1;
	this.meleeAttackCooldown = 0;
	this.rangedAttackCooldown = Math.floor(Math.random() * this.rangedAttackCooldownRandomModifier);
	this.rangedAttackChargeCooldown = 0;
	this.chargingUpRangedAttack = false;
};

GS.OnlinePlayer.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.OnlinePlayer,

	init: function() {
		this.animationView = new GS.AnimationView(this);
		this.animationView.init();
		this.animationView.setLoop("walk");

		this.updateBoundingBox();
		this.updateMesh();

		this.sector = this.getSector();

	},

	update: function() {
		this.animationView.update();

		if (!this.dead) {
      this.updateMove();
    }

			// if (this.state === GS.OnlinePlayerStates.Awake) {
				// this.updateScan();
			// } else if (this.state === GS.OnlinePlayerStates.Active) {
		// 		if (this.attackType === GS.OnlinePlayerAttackTypes.Melee) {
		// 			this.updateAttackMelee();
		// 		} else
		// 		if (this.attackType === GS.OnlinePlayerAttackTypes.Ranged) {
		// 			this.updateAttackRanged();
		// 		}
			// }
		// }

		this.updateLightLevel();
	},

	updateLightLevel: function() {
		this.getLightColorFromSector(this.animationView.currentMesh.material.emissive, this.sector);
	},

	updateMesh: function() {
		this.view.mesh.position.copy(this.position);
		this.view.mesh.position.y += this.animationView.positionYOffset;
		this.view.mesh.rotation.y = this.xAngle + this.rotationOffset + this.animationView.rotationYOffset;
	},

	// updateScan: function() {
	// 	var target = this.grid.player;

	// 	if (this.inMeleeRange(target.position)) {
	// 		this.activate();
	// 		return;
	// 	}

	// 	if (this.isFacing(target.position)) {
	// 		this.activate();
	// 		return;
	// 	}

	// 	this.updateMesh();
	// },

  updateMove: function () {
			if (this.inPain) {
				this.updateMesh();
			}
      // this.move();
			// this.calculateDirection(target.position);
			this.calculateRotation();
  },
	onUpdateMove: function(updatedClient, pos) {
    if (!this.dead) {
      let oldPos = this.position.clone();
      this.position.set(pos.x, pos.y, pos.z);
      let newPos = this.position.clone();
      GAME.onlineManager.checkZones(this, oldPos, newPos);
      let direction = pos.direction;
      this.direction.set(direction.x, direction.y, direction.z);
      this.move();
    }
    // this.calculateDirection(target.position);
    // this.calculateRotation();
    // this.updateMesh();
	},

	onPlayerShoot: function() {
		var direction = new THREE.Vector3();

		return function() {
			// this.moving = false;
			// var target = this.grid.player;

			// this.chargingUpRangedAttack = false;
			// this.animationView.setLoop("walk");

			// this.rangedAttackCooldown = this.rangedAttackMaxCooldown +
				// Math.floor(Math.random() * this.rangedAttackCooldownRandomModifier);

			// direction.copy(this.position).sub(this.position).normalize();
			this.grid.addProjectile(this, "pistol_bolt", this.position.clone(), this.direction.clone());
		}
	}(),

	move: function() {
		var newPos = new THREE.Vector3();

		return function() {
			this.moving = true;
			newPos.copy(this.direction).multiplyScalar(this.speed).add(this.position);
			this.grid.collisionManager.collideOnlinePlayer(this, this.position, newPos);
		}
	}(),

	chargeUpRangedAttack: function() {
		this.grid.soundManager.playSound(this.rangedAttackChargeUpSound);
		this.moving = false;
		this.chargingUpRangedAttack = true;
		this.rangedAttackChargeCooldown = this.rangedAttackChargeMaxCooldown;
		this.animationView.setLoop("attack");
	},

	cancelRangedAttack: function() {
		this.chargingUpRangedAttack = false;
		this.rangedAttackChargeCooldown = 0;
		this.animationView.setLoop("walk");
	},

	inMeleeRange: function(pos) {
		return this.position.distanceTo(pos) < this.meleeRange;
	},

	inRangedAttackRange: function(pos) {
		return this.position.distanceTo(pos) < this.rangedAttackRange;
	},

	isFacing: function() {
		var p = new THREE.Vector2();
		var t = new THREE.Vector2();
		var a = new THREE.Vector2();
		var b = new THREE.Vector2();

		return function(pos) {
			this.position.toVector2(p);
			pos.toVector2(t);
			var x = this.xAngle + this.rotationOffset;
			a.set(Math.sin(x - Math.PI / 2), Math.cos(x - Math.PI / 2)).add(p);
			b.set(Math.sin(x + Math.PI / 2), Math.cos(x + Math.PI / 2)).add(p);

			return GS.MathHelper.vec2PointSide(a, b, t);
		}
	}(),

	calculateDirection: function(targetPos) {
		this.direction.copy(targetPos).sub(this.position);
		this.direction.y = 0;
		this.direction.normalize();
	},

	calculateRotation: function() {
		this.xAngle = Math.atan2(this.direction.x, this.direction.z) + Math.PI;
	},

	updateCollisionData: function() {
		var velocity = new THREE.Vector3();

		return function(newPos) {
			velocity.copy(newPos).sub(this.position);
			var currentSpeed = newPos.distanceTo(this.position);

			this.position.copy(newPos);
			this.updateTriangles(velocity);
			this.updateBoundingBox();
			this.updateMesh();

			if (currentSpeed / this.speed < 0.1) {
				// this.scatter();
			}

			this.sector = this.getSector();
		}
	}(),

	activate: function(script) {
		if (this.state === GS.OnlinePlayerStates.Active) {
			return;
		}

		if (script !== true && this.state === GS.OnlinePlayerStates.Scripted) {
			return;
		}

		this.state = GS.OnlinePlayerStates.Active;
		this.animationView.setLoop("walk");
		this.grid.soundManager.playSound(this.roarSound);
	},

	onHit: function(projectile) {
		if (this.state !== GS.OnlinePlayerStates.Active) {
			this.activate(true);
		}

		if (Math.random() <= this.painChance) {
			this.inPain = true;
			this.moving = false;

			if (this.attackType === GS.OnlinePlayerAttackTypes.Ranged) {
				this.cancelRangedAttack();
			}

			this.animationView.pain();
			this.grid.soundManager.playSound(this.painSound);
		}

		this.health -= projectile.damage;
		if (this.health < 0) {
			this.health = 0;
			this.onDeath();
		}
	},

	onRespawn: function() {
    if (!this.dead) {
      return;
    }
		this.moving = true;

		// var target = this.grid.player;
		// this.calculateDirection(target.position);
		this.calculateRotation();

		this.dead = false;
    // TODO respawn sound
		// this.grid.soundManager.playSound(this.deathSound);
		this.animationView.setLoop("walk");
		this.updateMesh();
	},

	onDeath: function() {
    if (this.dead) {
      return;
    }
		this.moving = false;

		// var target = this.grid.player;
		// this.calculateDirection(target.position);
		this.calculateRotation();

		this.dead = true;
		this.grid.soundManager.playSound(this.deathSound);
		GAME.onlineManager.onOnlinePlayerDeath(this.playerInfo);
		this.animationView.setLoop("death");
		this.updateMesh();
	},

  playerInfo: function () {
    return {
      id: this.id,
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      direction: this.direction,
    };
  },

  setPosition: function (x, y, z, direction) {
    this.position.x = x,
    this.position.y = y
    this.position.z = z
    this.direction = direction
  }
});
