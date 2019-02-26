using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Serialization;
using Swashbuckle.AspNetCore.Swagger;
using VideoWeb.Swagger;

namespace VideoWeb
{
    public static class ConfigureServicesExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddSwaggerGen(c =>
            {
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                c.IncludeXmlComments(xmlPath);
                
                c.SwaggerDoc("v1", new Info {Title = "Video App", Version = "v1"});
                c.EnableAnnotations();
                
                c.OperationFilter<AuthResponsesOperationFilter>();
                
                c.AddSecurityDefinition("Bearer", new ApiKeyScheme { In = "header", Description = "Please enter JWT with Bearer into field", Name = "Authorization", Type = "apiKey" });
                c.AddSecurityRequirement(new Dictionary<string, IEnumerable<string>> {
                    { "Bearer", Enumerable.Empty<string>() },
                });
            });

            return serviceCollection;
        }
        
        public static IServiceCollection AddCustomTypes(this IServiceCollection services)
        {
            return services;
        }
        
        public static IServiceCollection AddJsonOptions(this IServiceCollection serviceCollection)
        {
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };

            serviceCollection.AddMvc()
                .AddJsonOptions(options => options.SerializerSettings.ContractResolver = contractResolver)
                .AddJsonOptions(options =>
                    options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter()));

            return serviceCollection;
        }
    }
}