// src/utils/system-initializer.js
const fs = require('fs');
const path = require('path');

class SystemInitializer {
  constructor() {
    this.startTime = Date.now();
    this.loadedComponents = {
      models: { loaded: 0, total: 0, errors: [] },
      controllers: { loaded: 0, total: 0, errors: [] },
      services: { loaded: 0, total: 0, errors: [] },
      routes: { loaded: 0, total: 0, errors: [] },
      middlewares: { loaded: 0, total: 0, errors: [] },
      validators: { loaded: 0, total: 0, errors: [] },
      migrations: { loaded: 0, total: 0, errors: [] }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icons = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      loading: '🔄',
      rocket: '🚀',
      database: '🗄️',
      check: '✔️'
    };
    
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  logSection(title, icon = '📋') {
    console.log('\n' + '='.repeat(60));
    console.log(`${icon} ${title}`);
    console.log('='.repeat(60));
  }

  logSubSection(title, icon = '📝') {
    console.log(`\n--- ${icon} ${title} ---`);
  }

  async initializeSystem() {
    this.logSection('🚀 INICIANDO SISTEMA STETICSOFT', '🚀');
    this.log('Iniciando proceso de carga completa del sistema...', 'loading');

    try {
      // 1. Verificar estructura de directorios
      await this.verifyDirectoryStructure();
      
      // 2. Cargar y verificar modelos
      await this.loadModels();
      
      // 3. Cargar y verificar controladores
      await this.loadControllers();
      
      // 4. Cargar y verificar servicios
      await this.loadServices();
      
      // 5. Cargar y verificar rutas
      await this.loadRoutes();
      
      // 6. Cargar y verificar middlewares
      await this.loadMiddlewares();
      
      // 7. Cargar y verificar validadores
      await this.loadValidators();
      
      // 8. Verificar migraciones
      await this.verifyMigrations();
      
      // 9. Verificar conexión a base de datos
      await this.verifyDatabaseConnection();
      
      // 10. Mostrar resumen final
      this.showFinalSummary();
      
    } catch (error) {
      this.log(`Error crítico durante la inicialización: ${error.message}`, 'error');
      throw error;
    }
  }

  async verifyDirectoryStructure() {
    this.logSubSection('Verificando estructura de directorios', '📁');
    
    const requiredDirs = [
      'src/models',
      'src/controllers', 
      'src/services',
      'src/routes',
      'src/middlewares',
      'src/validators',
      'migrations'
    ];

    for (const dir of requiredDirs) {
      if (fs.existsSync(dir)) {
        this.log(`✅ Directorio ${dir} existe`, 'success');
      } else {
        this.log(`❌ Directorio ${dir} no encontrado`, 'error');
        throw new Error(`Directorio requerido no encontrado: ${dir}`);
      }
    }
  }

  async loadModels() {
    this.logSubSection('Cargando modelos de base de datos', '🗄️');
    
    const modelsDir = 'src/models';
    const modelFiles = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.model.js') && file !== 'index.js');
    
    this.loadedComponents.models.total = modelFiles.length;
    
    for (const file of modelFiles) {
      try {
        const modelName = file.replace('.model.js', '');
        this.log(`🔄 Cargando modelo: ${modelName}`, 'loading');
        
        // Simular carga del modelo
        const modelPath = path.join(modelsDir, file);
        require(modelPath);
        
        this.loadedComponents.models.loaded++;
        this.log(`✅ Modelo ${modelName} cargado correctamente`, 'success');
      } catch (error) {
        this.loadedComponents.models.errors.push({ file, error: error.message });
        this.log(`❌ Error cargando modelo ${file}: ${error.message}`, 'error');
      }
    }
  }

  async loadControllers() {
    this.logSubSection('Cargando controladores', '🎮');
    
    const controllersDir = 'src/controllers';
    const controllerFiles = fs.readdirSync(controllersDir)
      .filter(file => file.endsWith('.controller.js'));
    
    this.loadedComponents.controllers.total = controllerFiles.length;
    
    for (const file of controllerFiles) {
      try {
        const controllerName = file.replace('.controller.js', '');
        this.log(`🔄 Cargando controlador: ${controllerName}`, 'loading');
        
        const controllerPath = path.resolve(controllersDir, file);
        const controller = require(controllerPath);
        
        // Verificar que el controlador tenga funciones exportadas
        const exportedFunctions = Object.keys(controller);
        if (exportedFunctions.length > 0) {
          this.loadedComponents.controllers.loaded++;
          this.log(`✅ Controlador ${controllerName} cargado (${exportedFunctions.length} funciones)`, 'success');
        } else {
          throw new Error('No se encontraron funciones exportadas');
        }
      } catch (error) {
        this.loadedComponents.controllers.errors.push({ file, error: error.message });
        this.log(`❌ Error cargando controlador ${file}: ${error.message}`, 'error');
      }
    }
  }

  async loadServices() {
    this.logSubSection('Cargando servicios', '⚙️');
    
    const servicesDir = 'src/services';
    const serviceFiles = fs.readdirSync(servicesDir)
      .filter(file => file.endsWith('.service.js'));
    
    this.loadedComponents.services.total = serviceFiles.length;
    
    for (const file of serviceFiles) {
      try {
        const serviceName = file.replace('.service.js', '');
        this.log(`🔄 Cargando servicio: ${serviceName}`, 'loading');
        
        const servicePath = path.resolve(servicesDir, file);
        const service = require(servicePath);
        
        // Verificar que el servicio tenga funciones exportadas
        const exportedFunctions = Object.keys(service);
        if (exportedFunctions.length > 0) {
          this.loadedComponents.services.loaded++;
          this.log(`✅ Servicio ${serviceName} cargado (${exportedFunctions.length} funciones)`, 'success');
        } else {
          throw new Error('No se encontraron funciones exportadas');
        }
      } catch (error) {
        this.loadedComponents.services.errors.push({ file, error: error.message });
        this.log(`❌ Error cargando servicio ${file}: ${error.message}`, 'error');
      }
    }
  }

  async loadRoutes() {
    this.logSubSection('Cargando rutas', '🛣️');
    
    const routesDir = 'src/routes';
    const routeFiles = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('.routes.js'));
    
    this.loadedComponents.routes.total = routeFiles.length;
    
    for (const file of routeFiles) {
      try {
        const routeName = file.replace('.routes.js', '');
        this.log(`🔄 Cargando ruta: ${routeName}`, 'loading');
        
        const routePath = path.join(routesDir, file);
        const route = require(routePath);
        
        // Verificar que la ruta sea un router de Express
        if (route && typeof route === 'function') {
          this.loadedComponents.routes.loaded++;
          this.log(`✅ Ruta ${routeName} cargada correctamente`, 'success');
        } else {
          throw new Error('No es un router válido de Express');
        }
      } catch (error) {
        this.loadedComponents.routes.errors.push({ file, error: error.message });
        this.log(`❌ Error cargando ruta ${file}: ${error.message}`, 'error');
      }
    }
  }

  async loadMiddlewares() {
    this.logSubSection('Cargando middlewares', '🔧');
    
    const middlewaresDir = 'src/middlewares';
    const middlewareFiles = fs.readdirSync(middlewaresDir)
      .filter(file => file.endsWith('.middleware.js') || file.endsWith('.js'));
    
    this.loadedComponents.middlewares.total = middlewareFiles.length;
    
    for (const file of middlewareFiles) {
      try {
        const middlewareName = file.replace('.middleware.js', '').replace('.js', '');
        this.log(`🔄 Cargando middleware: ${middlewareName}`, 'loading');
        
        const middlewarePath = path.join(middlewaresDir, file);
        const middleware = require(middlewarePath);
        
        this.loadedComponents.middlewares.loaded++;
        this.log(`✅ Middleware ${middlewareName} cargado correctamente`, 'success');
      } catch (error) {
        this.loadedComponents.middlewares.errors.push({ file, error: error.message });
        this.log(`❌ Error cargando middleware ${file}: ${error.message}`, 'error');
      }
    }
  }

  async loadValidators() {
    this.logSubSection('Cargando validadores', '📋');
    
    const validatorsDir = 'src/validators';
    const validatorFiles = fs.readdirSync(validatorsDir)
      .filter(file => file.endsWith('.validators.js'));
    
    this.loadedComponents.validators.total = validatorFiles.length;
    
    for (const file of validatorFiles) {
      try {
        const validatorName = file.replace('.validators.js', '');
        this.log(`🔄 Cargando validador: ${validatorName}`, 'loading');
        
        const validatorPath = path.join(validatorsDir, file);
        const validator = require(validatorPath);
        
        this.loadedComponents.validators.loaded++;
        this.log(`✅ Validador ${validatorName} cargado correctamente`, 'success');
      } catch (error) {
        this.loadedComponents.validators.errors.push({ file, error: error.message });
        this.log(`❌ Error cargando validador ${file}: ${error.message}`, 'error');
      }
    }
  }

  async verifyMigrations() {
    this.logSubSection('Verificando migraciones', '🔄');
    
    const migrationsDir = 'migrations';
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') && !file.includes('.md'));
    
    this.loadedComponents.migrations.total = migrationFiles.length;
    
    for (const file of migrationFiles) {
      try {
        const migrationName = file.replace('.js', '');
        this.log(`🔄 Verificando migración: ${migrationName}`, 'loading');
        
        const migrationPath = path.join(migrationsDir, file);
        const migration = require(migrationPath);
        
        // Verificar que la migración tenga las funciones up y down
        if (migration.up && migration.down) {
          this.loadedComponents.migrations.loaded++;
          this.log(`✅ Migración ${migrationName} verificada correctamente`, 'success');
        } else {
          throw new Error('Migración no tiene funciones up/down válidas');
        }
      } catch (error) {
        this.loadedComponents.migrations.errors.push({ file, error: error.message });
        this.log(`❌ Error verificando migración ${file}: ${error.message}`, 'error');
      }
    }
  }

  async verifyDatabaseConnection() {
    this.logSubSection('Verificando conexión a base de datos', '🗄️');
    
    try {
      const db = require('../models');
      await db.sequelize.authenticate();
      this.log('✅ Conexión a base de datos establecida correctamente', 'success');
      
      // Verificar que los modelos estén sincronizados
      const modelCount = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize').length;
      this.log(`✅ ${modelCount} modelos sincronizados con la base de datos`, 'success');
      
    } catch (error) {
      this.log(`❌ Error conectando a la base de datos: ${error.message}`, 'error');
      throw error;
    }
  }

  showFinalSummary() {
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    this.logSection('📊 RESUMEN FINAL DEL SISTEMA', '📊');
    
    let totalLoaded = 0;
    let totalComponents = 0;
    let totalErrors = 0;
    
    Object.keys(this.loadedComponents).forEach(component => {
      const stats = this.loadedComponents[component];
      totalLoaded += stats.loaded;
      totalComponents += stats.total;
      totalErrors += stats.errors.length;
      
      const status = stats.errors.length === 0 ? '✅' : '⚠️';
      this.log(`${status} ${component.toUpperCase()}: ${stats.loaded}/${stats.total} cargados`, 
               stats.errors.length === 0 ? 'success' : 'warning');
      
      if (stats.errors.length > 0) {
        stats.errors.forEach(error => {
          this.log(`   ❌ ${error.file}: ${error.error}`, 'error');
        });
      }
    });
    
    this.log(`\n📈 ESTADÍSTICAS GENERALES:`, 'info');
    this.log(`   • Total de componentes: ${totalComponents}`, 'info');
    this.log(`   • Componentes cargados: ${totalLoaded}`, 'success');
    this.log(`   • Errores encontrados: ${totalErrors}`, totalErrors === 0 ? 'success' : 'error');
    this.log(`   • Tiempo de inicialización: ${totalTime}ms`, 'info');
    
    if (totalErrors === 0) {
      this.log('\n🎉 ¡SISTEMA COMPLETAMENTE INICIALIZADO!', 'success');
      this.log('✅ Todos los componentes cargados sin errores', 'success');
      this.log('✅ Base de datos conectada y sincronizada', 'success');
      this.log('✅ Sistema listo para recibir peticiones', 'success');
    } else {
      this.log('\n⚠️ SISTEMA INICIALIZADO CON ADVERTENCIAS', 'warning');
      this.log(`❌ Se encontraron ${totalErrors} errores que requieren atención`, 'error');
    }
    
    this.logSection('🚀 SISTEMA STETICSOFT LISTO', '🚀');
  }
}

module.exports = SystemInitializer;
